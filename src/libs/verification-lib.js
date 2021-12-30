/**
 * Contract Verification for Telos EVM
 * compiles and compares bytecode with uploaded contracts to verify source authenticity. 
 * see teloscan repo 'ContractVerification.vue' for implementation
 */

const solc = require('solc');
const Web3Eth = require('web3-eth');
const eth = new Web3Eth('https://cloudflare-eth.com/');

const NONE = 'n/a';
const constructorArgs = [42,"0x46ef48e06ff160f311d17151e118c504d015ec6e"];

const isContract = async (address) => {
    const byteCode = await eth.getCode(address);
    console.log(byteCode);
    return byteCode != "0x";
}

const verifyContract = async (requestBody) => {

    const fileName = requestBody.fileName;

    const input = {
        language: 'Solidity',
        sources: {},
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };
    input.sources[fileName] = { content: requestBody.contractCode };

    const output = await compileFile(requestBody.compilerVersion, input);

    for (let contractName in output.contracts[fileName]) {
        let encodedConstructorArgs = NONE; 
        let decodedConstructorArgs = NONE;

        const bytecode = output.contracts[fileName][contractName].evm.bytecode.object;
        const abi = output.contracts[fileName][contractName].abi;
        const argTypes = getArgTypes(abi);

        if (argTypes.length) {
            try{
                encodedConstructorArgs = eth.abi.encodeParameters(argTypes, constructorArgs)
                decodedConstructorArgs = eth.abi.decodeParameters(argTypes, encodedConstructorArgs) 
            }catch(e){
                console.error(e);
            }
        }

        if (encodedConstructorArgs !== NONE){
            console.log("bytecode w/constructor args: ", bytecode + encodedConstructorArgs.substring(2))
        }

        const deployedByteCode = await eth.getCode(requestBody.contractAddress);
        return bytecode === deployedByteCode;
        // return { contract: contractName, bytecode, abi, constructorArgs: encodedConstructorArgs }
    }
}

compileFile = async (compilerVersion, input) => {
    return await new Promise((resolve,reject) => {
        solc.loadRemoteVersion(compilerVersion, (e, solcVersion) => {
            e ? reject(e) : resolve(JSON.parse(solcVersion.compile(JSON.stringify(input))));
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

module.exports = { verifyContract, isContract };


//  // below used for testing
// const mockRequestBody = {
//     fileName: 'test.sol',
//     contractCode: 
//     `pragma solidity ^0.7.1;
//     contract B { 
//         uint value;
//         uint myValue;
//         address initAddress;
//         constructor(uint _constructorArg, address _address) {
//             value = _constructorArg;
//             initAddress = _address;
//         }
//         function set(uint _value) public { myValue= _value; }
//         function get() public view returns (uint) { return value + myValue; }
//     }`,
//     compilerVersion: "v0.7.1+commit.f4a555be"
// };


// (async () => { 
//     const test = await processFile(mockRequestBody);
//     console.dir(test, {depth: null});
//     await isContract();
// })();
