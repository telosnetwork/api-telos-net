/**
 * Contract Verification for Telos EVM
 * compiles and compares bytecode with uploaded contracts to verify source authenticity. 
 * If a match and not present in current db, it is stored for future reference. 
 * see teloscan repo 'ContractVerification.vue' for client implementation.
 */
const solc = require('solc');
const Web3Eth = require('web3-eth');
const eth = new Web3Eth(process.env.evmProvider);
const { getObject, uploadObject } = require('./aws-s3-lib');

const isContract = async (address) => {
    const byteCode = await eth.getCode(address);
    return byteCode != "0x";
}

const verifyContract = async (formData) => {
    let fileName, decodedData, constructorArgs, input;
    const fileData = formData.files;
    constructorArgs = formData.constructorArgs.length ? formData.constructorArgs.split(',') : [];
    fileName = formData.sourceName;

    if (typeof fileData === 'string'){
        decodedData = removeBrowserFormatting(fileData);
        input = getInputObject(formData, decodedData);
    }else{
        decodedData = decodeStream(fileData.data);
        const extension = getFileExtension(fileData.name);
        if (extension === 'sol'){
            input = getInputObject(formData, decodedData);
        }else{
            input = JSON.parse(decodedData);
            fileName = Object.keys(input.sources)[0];
        }
    }

    const deployedByteCode = await eth.getCode(formData.contractAddress);
    const output = await compileFile(formData.compilerVersion,input);
    const contract = Object.values(output.contracts[fileName])[0];
    const abi = contract.abi;
    const functionHashes = contract.evm.methodIdentifiers;
    const bytecode = `0x${contract.evm.deployedBytecode.object}`;
    const argTypes = getArgTypes(abi);

    if (argTypes.length > 0) {
        bytecode += getEncodedConstructorArgs(argTypes, constructorArgs);
    }

    if (bytecode === deployedByteCode){
        await uploadObject(fileName, JSON.stringify(output))
    }

    return bytecode === deployedByteCode;
}

getInputObject = (formData, code) => {
    input = {
        language: 'Solidity',
        sources: {
            [formData.sourceName]: {
                content: code
            },
        },
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
}

removeBrowserFormatting = (fileData) => {
    return fileData.replace(/\r\n/g, '\n');
}

getFileExtension = (fileName) => {
    return fileName.split('.').pop();
}

decodeStream = (dataStream) => {
    return dataStream.toString('utf8');
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