/**
 * Contract Verification for Telos EVM
 * compiles and compares bytecode with uploaded contracts to verify source authenticity. 
 * If a match and not present in current db, it is stored for future reference. 
 * see teloscan repo 'ContractVerification.vue' for client implementation.
 */
const solc = require('solc');
const Web3Eth = require('web3-eth');
const eth = new Web3Eth(process.env.evmProvider);

const isContract = async (address) => {
    const byteCode = await eth.getCode(address);
    return byteCode != "0x";
}

const verifyContract = async (formData) => {
    const file = formData.files;
    const fileName = file.name;
    const code = parseCode(file.data);
    const constructorArgs = formData.constructorArgs.length ? formData.constructorArgs.split(',') : [];
    const deployedByteCode = await eth.getCode(formData.contractAddress);

    const input = {
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

    const output = await compileFile(formData.compilerVersion,input);
    const contract = Object.values(output.contracts[fileName])[0];
    const abi = contract.abi;
    const functionHashes = contract.evm.methodIdentifiers;
    const bytecode = contract.evm.bytecode.object;
    const argTypes = getArgTypes(abi);

    if (argTypes.length > 0) {
        bytecode += getEncodedConstructorArgs(argTypes, constructorArgs);
    }

    return `0x${bytecode}` === deployedByteCode;
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