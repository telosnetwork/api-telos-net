/**
 * Contract Verification for Telos EVM
 * compiles and compares bytecode with uploaded contracts to verify source authenticity. 
 * If a match and not present in current db, it is stored for future reference. 
 * see teloscan repo 'ContractVerification.vue' for client implementation.
 */
const solc = require('solc');
const Web3Eth = require('web3-eth');
const eth = new Web3Eth(process.env.evmProvider);
const fs = require('fs');

const isContract = async (address) => {
    const byteCode = await eth.getCode(address);
    return byteCode != "0x";
}

const verifyContract = async (formData) => {
    let fileName, code, compilerVersion, constructorArgs, input;
    const fileData = formData.files;
    fileName = formData.sourceName;
    if (typeof fileData === 'string'){
        code = removeBrowserFormatting(fileData);
    }else{
        const extension = getFileExtension(fileName);
        code = parseCode(fileData.data);

        if (extension === 'sol'){
            constructorArgs = formData.constructorArgs.length ? formData.constructorArgs.split(',') : [];
            input = {
                language: 'Solidity',
                sources: {
                    [fileName]: {
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
            if (formData.targetEvm){ input.settings['evmVersion'] = formData.targetEvm; };
        }else{
            input = JSON.parse(code);
            fileName = Object.keys(input.sources)[0];
        }
        compilerVersion = formData.compilerVersion;
    }

    const deployedByteCode = await eth.getCode(formData.contractAddress);
    const output = await compileFile(compilerVersion,input);
    const contract = Object.values(output.contracts[fileName])[0];
    const abi = contract.abi;
    const functionHashes = contract.evm.methodIdentifiers;
    const bytecode = `0x${contract.evm.deployedBytecode.object}`;
    const argTypes = getArgTypes(abi);

    if (argTypes.length > 0) {
        bytecode += getEncodedConstructorArgs(argTypes, constructorArgs);
    }

    return bytecode === deployedByteCode;
}

removeBrowserFormatting = (fileData) => {
    return fileData.replace(/\r\n/g, '\n');
}

getFileExtension = (fileName) => {
    return fileName.split('.').pop();
}

parseCode = (dataStream) => {
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