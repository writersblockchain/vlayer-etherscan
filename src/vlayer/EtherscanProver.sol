// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract EtherscanProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant DATA_URL = "https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=0x57d90b64a1a57749b0f932f1a3395792e12e7055&address=0xe04f27eb70e025b78871a2ad7eabe85e61212761&tag=latest&apikey=FWRCZEZCTDZ2DW9HCTQ78DAICCI53MDIEP";

    function main(WebProof calldata webProof) public view returns (Proof memory, string memory) {
        Web memory web = webProof.verify(DATA_URL);
        string memory balance = web.jsonGetString("result");
        return (proof(), balance);
    }
}