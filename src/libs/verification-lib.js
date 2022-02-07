/**
 * Contract Verification for Telos EVM
 * compiles contract source file(s) provided by the user and 
 * compares the resulting bytecode with creation transaction input and 
 * deployed bytecode to determine source authenticity. In the case of a match,
 * the generated (or provided) input object, and output objects are stored future 
 * reference and for render or download in applications.
 * See teloscan repo 'ContractVerification.vue' for client implementation.
 */
const axios = require("axios");
const solc = require('solc');
const Web3Eth = require('web3-eth');
const eth = new Web3Eth(process.env.evmProvider);
const { uploadObject } = require('./aws-s3-lib');

const isContract = async (address) => {
    const byteCode = await eth.getCode(address);
    return byteCode != "0x";
}

const verifyContract = async (formData) => {
    let fileName, decodedData, constructorArgs, input
    const fileData = formData.files; //passed as single object or array 
    constructorArgs = formData.constructorArgs.length ? formData.constructorArgs.split(',') : [];

    if (typeof fileData === 'string'){ // raw contract copy paste in textarea input
        decodedData = removeBrowserFormatting(fileData);
        fileName = constructFilename(formData.sourcePath, decodedData);
        input = getInputObject(formData);

        input.sources = { 
            [fileName] : {
                content: decodedData
            }
        }
    }else{ 
        if (formData.fileType){ // file option `.sol` 
            input = getInputObject(formData);
            const arrayArg = Array.isArray(fileData) ? fileData : [fileData];
            input.sources = getSourcesObj(formData.sourcePath, arrayArg)
        }else{ // file option `.json` 
            decodedData = decodeStream(fileData);
            input = JSON.parse(decodedData);
        }
        fileName = Object.keys(input.sources)[0];
    }
    
    if (formData.targetEvm !== 'default') {
        input.settings['evmVersion'] = formData.targetEvm;
    }
    
    const deployedByteCode = await eth.getCode(formData.contractAddress);
    const output = await compileFile(formData.compilerVersion,input);
    const contract = Object.values(output.contracts[fileName])[0];
    const abi = contract.abi;
    const bytecode = `0x${contract.evm.deployedBytecode.object}`;
    const argTypes = getArgTypes(abi);
    
    /**
     * results object returned to client
     * 
     * - full match - verified -
     * 
     * case: verified (no constructor)
     * full: true
     * partial: null
     * args: null
     * 
     * case: verified (w/constructor)
     * full: true
     * partial: null
     * args: true
     * 
     * - partial match - conditionally verified -
     * 
     * case: constructor args don't match
     * full: true
     * partial: null
     * args: false
     * 
     * case: metadata doesn't match (no constructor)
     * full: false
     * partial: true
     * args: null
     * 
     * case: metadata doesn't match, constructor args match
     * full: false
     * partial: true
     * args: true
     * 
     * case: metadata doesn't match, constructor args do not match
     * full: false
     * partial: true
     * args: false
     */
    const results = {
        full: bytecode === deployedByteCode, 
        partial: null, 
        args: null 
    };

    if (!results.full){
        results.partial = getPartialResult(byteCode, deployedByteCode);
    }

    if (argTypes.length > 0) {
        let result = false;
        if( argTypes.length === constructorArgs.length ){ 
            result = await verifyConstructorArgs(formData.address);
        }
        results.args = result;
    }

    if (results.full || results.partial){
        await upload(formData.address, input, 'input');
        await upload(formData.address, output, 'output');
        await upload(formData.address, abi, 'abi');
        await upload(formData.address, results, 'results');
    }

    return JSON.stringify(results);
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

verifyConstructorArgs = async (contractAddress) => {
    const contractResult = await axios(`${process.env.evmHyperionProvider}/get_contract?contract=${contractAddress}`);
    const creationTransaction = contractResult.data.creation_trx;
    const transactionResult = await axios(`${process.env.evmHyperionProvider}/get_transactions?hash=${creationTransaction}`);
    const creationInput = transactionResult.data.transactions[0].input_data;
    const encodedConstructorArgs =  getEncodedConstructorArgs(argTypes, constructorArgs);
    const deployedConstructorArgs = creationInput.slice(-encodedConstructorArgs.length);

    return encodedConstructorArgs === deployedConstructorArgs;
}

getEncodedConstructorArgs = (argTypes, constructorArgs) => {
    encodedConstructorArgs = eth.abi.encodeParameters(argTypes, constructorArgs)
    const encodedRaw = removeHexPrefix(encodedConstructorArgs);
    
    return encodedRaw;
}

removeHexPrefix = (encodedString) => {
    return encodedString.substring(3);
}

getPartialResult = (compiledByteCode, deployedByteCode) => {
    const difIndex = findFirstDiffPos(compiledByteCode, deployedByteCode);

    const cByteCount = getMetaByteCount(compiledBytecode);
    const compiledMeta = byteCode.slice(difIndex);

    const dByteCount = getMetaByteCount(deployedByteCode);
    const deployedMeta = deployedByteCode.slice(difIndex);

    return  deployedMeta.length === dByteCount && compiledMeta.length === cByteCount;
}

findFirstDiffPos = (a, b) => {
    if (a.length < b.length) [a, b] = [b, a];
    return [...a].findIndex((chr, i) => chr !== b[i]);
}

getMetaByteCount = (bytecode) => {
    const hexByte = bytecode.slice(-4); //total length of metadata is appended to bytecode
    return parseInt(hexByte, 16);
}

upload = async (address, object, filename) => {
    const name = obj => Object.keys(obj)[0];
    const test = name({object});
    const contentType = 'application/json';
    const buffer = new Buffer.from(JSON.stringify(object));
    await uploadObject(`${address}/${filename}.json`, buffer, contentType);
}

module.exports = { isContract, verifyContract };