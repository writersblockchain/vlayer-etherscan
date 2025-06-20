// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract EtherscanProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant URL_PREFIX = "https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&address=";

    function main(WebProof calldata webProof) 
        public 
        view 
        returns (Proof memory, string memory) 
    {
        // Verify the web proof came from a URL starting with our trusted prefix
        // Everything after the prefix (wallet address & API key) is redacted
        Web memory web = webProof.verifyWithUrlPrefix(URL_PREFIX);
        
        string memory balance = web.jsonGetString("result");
        return (proof(), balance);
    }
}