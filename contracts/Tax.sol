// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TaxedToken is ERC20, Ownable, ERC20Burnable {
    address public feeRecipient;
    uint256 public constant FEE_PERCENTAGE = 1;
    
    constructor(string memory name, string memory symbol, address _feeRecipient) 
        ERC20(name, symbol) 
        Ownable(msg.sender)
    {
        feeRecipient = _feeRecipient;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        return _taxedTransfer(_msgSender(), recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(sender, spender, amount);
        return _taxedTransfer(sender, recipient, amount);
    }

    function _taxedTransfer(address sender, address recipient, uint256 amount) internal virtual returns (bool) {
        require(sender != address(0), "Invalid Sender");
        require(recipient != address(0), "Invalid Recipient");
        require(amount > 0, "Insufficient amount");

        uint256 fee = (amount * FEE_PERCENTAGE) / 100;
        uint256 amountAfterFee = amount - fee;

        _transfer(sender, recipient, amountAfterFee);
        _transfer(sender, feeRecipient, fee);

        return true;
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        feeRecipient = newFeeRecipient;
    }

    function mintTo(uint256 amount, address recipient) external onlyOwner {
        _mint(recipient, amount);
    }


}
