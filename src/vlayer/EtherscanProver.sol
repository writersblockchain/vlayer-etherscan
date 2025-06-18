// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract EtherscanProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    // Hardcode the URL pattern with specific contract address, user provides wallet & API key
string public constant URL_PATTERN = "https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&address=";

    function main(WebProof calldata webProof, string memory fullUrl) public view returns (Proof memory, string memory) {
        // Validate that the URL starts with our expected pattern
        require(startsWith(fullUrl, URL_PATTERN), "Invalid URL pattern");
        
        Web memory web = webProof.verify(fullUrl);
        string memory balance = web.jsonGetString("result");
        return (proof(), balance);
    }

    // Helper function to check if a string starts with a given prefix
    function startsWith(string memory str, string memory prefix) private pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) {
            return false;
        }
        
        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        
        return true;
    }
}