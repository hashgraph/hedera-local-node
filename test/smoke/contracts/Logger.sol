// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Logger {
    event Something(uint x, uint y);

    function logEvent(uint x, uint y) payable public {
        emit Something(x, y);
    }
}
