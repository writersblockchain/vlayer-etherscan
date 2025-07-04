// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";

import {EtherscanProver} from "./EtherscanProver.sol";

contract EtherscanVerifier is Verifier {
    address public prover;

    string public balance;

    constructor(address _prover) {
        prover = _prover;
    }

    function verify(Proof calldata, string memory _balance) public onlyVerified(prover, EtherscanProver.main.selector) {
        balance = _balance;
    }
}