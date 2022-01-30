/**
 * Contract Verification for Telos EVM
 * compiles and compares bytecode with uploaded contracts to verify source authenticity. 
 * If a match and not present in current db, it is stored for future reference. 
 * see teloscan repo 'ContractVerification.vue' for client implementation.
 */
const solc = require('solc');
const Web3Eth = require('web3-eth');
const eth = new Web3Eth(process.env.evmProvider);
const { uploadObject } = require('./aws-s3-lib');

const isContract = async (address) => {
    const byteCode = await eth.getCode(address);
    return byteCode != "0x";
}

const verifyContract = async (formData) => {
    let fileName, decodedData, constructorArgs, input, deployedByteCode;
    const fileData = formData.files; //passed as single object or array 
    constructorArgs = formData.constructorArgs.length ? formData.constructorArgs.split(',') : [];

    if (typeof fileData === 'string'){
        decodedData = removeBrowserFormatting(fileData);
        fileName = constructFilename(formData.sourcePath, decodedData);
        input = getInputObject(formData);

        input.sources = { 
            [fileName] : {
                content: decodedData
            }
        }
    }else{ 
        if (formData.fileType){ 
            input = getInputObject(formData);
            const arrayArg = Array.isArray(fileData) ? fileData : [fileData];
            input.sources = getSourcesObj(formData.sourcePath, arrayArg)
        }else{
            decodedData = decodeStream(fileData);
            input = JSON.parse(decodedData);
        }
        fileName = Object.keys(input.sources)[0];

    }
    
    
    try{ 
        deployedByteCode = await eth.getCode(formData.contractAddress);
    }catch(e){
        return e
    }

    const output = await compileFile(formData.compilerVersion,input);
    const contract = Object.values(output.contracts[fileName])[0];
    const abi = contract.abi;
    const argTypes = getArgTypes(abi);
    let bytecode = `0x${contract.evm.deployedBytecode.object}`;

    if (argTypes.length > 0 && argTypes.length === constructorArgs.length) {
        bytecode += getEncodedConstructorArgs(argTypes, constructorArgs);
    }

    if (bytecode === deployedByteCode){
        const contentType = 'application/json';
        let buffer = new Buffer.from(JSON.stringify(input));
        await uploadObject(`${formData.contractAddress}/input.json`, buffer, contentType);
        buffer = new Buffer.from(JSON.stringify(output));
        await uploadObject(`${formData.contractAddress}/output.json`, buffer, contentType);
        buffer = new Buffer.from(JSON.stringify(abi));
        await uploadObject(`${formData.contractAddress}/abi.json`, buffer, contentType);
    }
    return bytecode === deployedByteCode;
}

constructFilename = (sourcePath, decodedData) => {
    let regexResults = decodedData.match(new RegExp('[C|c]ontract ' + "(.*)" + '\{'));
    regexResults = regexResults[1].toLowerCase().split(' ');
    const contractFileName = `${sourcePath}${regexResults[0].replace(/\s+/g, '')}.sol`;
    return contractFileName;
}

getInputObject = (formData) => {

    input = {
        language: 'Solidity',
        sources: {},
        settings: {
          optimizer: {
              enabled: formData.optimizer,
              runs: formData.runs
          },
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };

    return input;
};

getSourcesObj = (sourcePath, fileArray ) =>{
    let sources = {};
    for (let i in fileArray ) {
        const code  = decodeStream(fileArray[i].data);
        sources[`${sourcePath}${fileArray[i].name}`] = {
            content: code
        }  
    }
    return sources;
}

decodeStream = (dataStream) => {
    return dataStream.toString('utf8');
}

removeBrowserFormatting = (fileData) => {
    return fileData.replace(/\r\n/g, '\n');
}

compileFile = async (compilerVersion, input) => {
    return await new Promise((resolve,reject) => {
        solc.loadRemoteVersion(compilerVersion, (e, solcVersion) => {
            e ? reject(e) 
            : resolve(JSON.parse(solcVersion.compile(JSON.stringify(input))));
        });
    })
}

getEncodedConstructorArgs = (argTypes, constructorArgs) => {
    encodedConstructorArgs = eth.abi.encodeParameters(argTypes, constructorArgs)
    const encodedRaw = removeHexPrefix(encodedConstructorArgs);
    
    return encodedRaw;
}

getArgTypes = (abi) => {
    const typesArr = [];
    const constructorObj = abi.find(obj => { return obj.type === 'constructor' });
    if (constructorObj && constructorObj.inputs.length > 0){
        for (let i=0; i<constructorObj.inputs.length; i++){
            typesArr.push(constructorObj.inputs[i].type);
        }
    }
    return typesArr;
}

removeHexPrefix = (encodedString) => {
    return encodedString.substring(3);
}

module.exports = { isContract, verifyContract };