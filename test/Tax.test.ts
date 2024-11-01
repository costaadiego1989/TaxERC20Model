import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Tax", function () {

  const tokenName = "TaxedToken";
  const tokenSymbol = "TAX";

  async function deployFixture() {
    const [owner, _feeRecipient, spender, sender] = await hre.ethers.getSigners();

    const Tax = await hre.ethers.getContractFactory("Tax");
    const contract = await Tax.deploy(tokenName, tokenSymbol, _feeRecipient);

    return { contract, owner, _feeRecipient, spender, sender };
  }

  describe("Tax Tests", function () {

    it("Should be Name", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);
      
      expect(await contract.name()).to.equal(tokenName);
    });

    it("Should be Symbol", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);
      
      expect(await contract.symbol()).to.equal(tokenSymbol);
    });
    
    it("Should mint", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

      await contract.mintTo(1000, owner);

      const totalSupply = await contract.totalSupply();

      expect(await contract.balanceOf(owner)).to.equal(1000);
      expect(totalSupply).to.equal(1000);
    });

    it("Should NOT mint if not owner", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

      const instance = contract.connect(_feeRecipient);

      expect(instance.mintTo(1000, owner)).to.revertedWithCustomError(contract, "ERC20InvalidReceiver");
    });

    it("Should NOT mint if amount is zero", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

      expect(contract.mintTo(0, owner)).to.be.revertedWith("Invalid amount");
    });

    it("Should NOT mint if no recipient", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

      const instance = "0x00000000";

      expect(contract.mintTo(1000, instance)).to.be.revertedWithCustomError(contract, "ERC20InvalidReceiver");
    });

    it("Should burn", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

      await contract.mintTo(1000, owner.address);

      expect(await contract.balanceOf(owner.address)).to.equal(1000);
  
      await contract.burn(100);
  
      expect(await contract.balanceOf(owner.address)).to.equal(900);
    });

    it("Should NOT burn if no Token", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);
    
      expect(contract.burn(100)).to.be.revertedWithCustomError(contract, "ERC20InsufficientBalance");
    });

    it("Should fail if tries to burn more tokens than they have", async function () {
      const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

      await contract.mintTo(1000, owner.address);

      const excessiveBurnAmount = hre.ethers.parseUnits("2000", 18);

      await expect(contract.burn(excessiveBurnAmount)).to.be.revertedWithCustomError(contract,"ERC20InsufficientBalance");
  });

  it("Should fail if has zero balance", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    const burnAmount = hre.ethers.parseUnits("1", 18);

    await expect(contract.burn(burnAmount))
      .to
      .be
      .revertedWithCustomError(contract, "ERC20InsufficientBalance");
  });

  it("Should decrease after burn", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    await contract.mintTo(hre.ethers.parseUnits("10000", 18), owner.address);

    const totalSupply = await contract.totalSupply();
    const burnAmount = hre.ethers.parseUnits("100", 18);

    await contract.burn(burnAmount);

    const expectedSupply = totalSupply - burnAmount;

    expect(await contract.totalSupply()).to.be.equal(expectedSupply);
  });

  it("Should transfer", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    await contract.mintTo(hre.ethers.parseUnits("10000", 18), owner.address);

    const balanceOfRecipientBeforeWithdraw = await contract.balanceOf(_feeRecipient);
    const balanceOfContractBeforeWithdraw = await contract.balanceOf(owner);
    const transferAmount = hre.ethers.parseUnits("100", 18);

    await contract.transfer(_feeRecipient, transferAmount);

    const balanceOfRecipientAfterWithdraw = await contract.balanceOf(_feeRecipient);
    const balanceOfContractAfterWithdraw = await contract.balanceOf(owner);

    const totalSupply = await contract.totalSupply();
    const expectedSupply = totalSupply - transferAmount;

    expect(balanceOfContractAfterWithdraw).to.be.lessThan(balanceOfContractBeforeWithdraw);
    expect(balanceOfRecipientAfterWithdraw).to.be.gt(balanceOfRecipientBeforeWithdraw);
    expect(expectedSupply).to.be.lt(totalSupply);
  });

  it("Should NOT transfer (Auth)", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    await contract.mintTo(hre.ethers.parseUnits("10000", 18), owner.address);

    const transferAmount = hre.ethers.parseUnits("100", 18);
    const instance = contract.connect(_feeRecipient);

    expect(instance.transfer(_feeRecipient, transferAmount)).to.be.revertedWithCustomError(contract, "ERC20InsufficientAllowance");
  });

  it("Should NOT transfer (Balance)", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    const transferAmount = hre.ethers.parseUnits("100", 18);

    await contract.mintTo(hre.ethers.parseUnits("10000", 18), owner.address);

    expect(contract.connect(_feeRecipient).transfer(owner, transferAmount)).to.be.revertedWithCustomError(contract, "ERC20InsufficientBalance");
  });

  it("Should fail if the sender does not have enough balance", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    const transferAmount = hre.ethers.parseUnits("10000", 18);

    await contract.mintTo(hre.ethers.parseUnits("10000", 18), owner.address);

    expect(contract.transfer(_feeRecipient, transferAmount)).to.be.revertedWithCustomError(contract, "ERC20InsufficientBalance");
  });

  it("Should fail if transferring to address(0)", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);
    const transferAmount = hre.ethers.parseUnits("100", 18);

    await expect(contract.transfer(hre.ethers.ZeroAddress, transferAmount)).to.be.revertedWith("Invalid Recipient");
  });

  it("Should fail if amount does not pay the fee", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    await expect(contract.transfer(_feeRecipient, 0)).to.be.revertedWith("Insufficient amount");
  });

  it("Should set fee recipient", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    await contract.setFeeRecipient(_feeRecipient);
    const getFeeRecipient = await contract.feeRecipient();

    expect(getFeeRecipient).to.equal(_feeRecipient);
  });

  it("Should fail to set zero address recipient", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    expect(contract.setFeeRecipient(hre.ethers.ZeroAddress)).to.be.revertedWith("Invalid Recipient");
  });

  it("Should fail if non owner tries to set the fee recipient", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);

    await expect(contract.connect(_feeRecipient).setFeeRecipient(_feeRecipient)).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("Should transfer from", async function () {
    const { contract, _feeRecipient, spender, sender } = await loadFixture(deployFixture);

    const mintAmount = hre.ethers.parseUnits("10000", 18);
    const transferAmount = hre.ethers.parseUnits("100", 18);

    await contract.mintTo(mintAmount, sender);

    await contract.connect(sender).approve(spender.address, transferAmount);

    await contract.connect(spender).transferFrom(
        sender.address,
        _feeRecipient.address,
        transferAmount
    );

    const expectedSenderBalance = mintAmount - transferAmount;

    expect(await contract.balanceOf(sender.address)).to.equal(expectedSenderBalance);
  });

  it("Should fail if spender does not have allowance", async function () {
    const { contract, owner, _feeRecipient, sender } = await loadFixture(deployFixture);

    const transferAmount = hre.ethers.parseUnits("2000", 18);

    await expect(contract.connect(sender)
      .transferFrom(sender, _feeRecipient, transferAmount))
      .to
      .be
      .revertedWithCustomError(contract, "ERC20InsufficientAllowance")
  });

  it("Should fail if sender does not have balance", async function () {
    const { contract, owner, sender, spender } = await loadFixture(deployFixture);

    const mintAmount = hre.ethers.parseUnits("1000", 18);
    const transferAmount = hre.ethers.parseUnits("1001", 18);

    await contract.mintTo(mintAmount, sender);

    await expect(
        contract.connect(sender)
        .transferFrom(sender, spender, transferAmount))
        .to
        .be
        .revertedWithCustomError(contract, "ERC20InsufficientAllowance");
  });

  it("Should fail if transferring to address(0)", async function () {
    const { contract, owner, _feeRecipient } = await loadFixture(deployFixture);
    const transferAmount = hre.ethers.parseUnits("100", 18);

    await expect(contract.transferFrom(owner, hre.ethers.ZeroAddress, transferAmount))
      .to
      .be
      .revertedWithCustomError(contract, "ERC20InsufficientAllowance");
  });

  it("Should emit two Transfer events: one for recipient and one for feeRecipient", async function () {
    const { contract, owner, sender, spender, _feeRecipient } = await loadFixture(deployFixture);

    const mintAmount = hre.ethers.parseUnits("10000", 18);
    const transferAmount = hre.ethers.parseUnits("100", 18);
    const expectedFee = hre.ethers.parseUnits("1", 18);

    await contract.mintTo(mintAmount, owner);
    await contract.approve(spender, transferAmount);

    expect(contract.connect(spender).transferFrom(sender, _feeRecipient, transferAmount))
        .to.emit(contract, "Transfer")
        .withArgs(sender.address, _feeRecipient, (transferAmount - expectedFee))
        .and.to.emit(contract, "Transfer")
        .withArgs(sender, _feeRecipient, expectedFee);
  });

  it("Should set a valid fee percentage", async function () {
    const { contract, owner } = await loadFixture(deployFixture);

    const newFeePercentage = 5;

    await contract.connect(owner).setFeePercentage(newFeePercentage);

    expect(await contract.FEE_PERCENTAGE()).to.equal(newFeePercentage);
});

it("Should fail if a non owner tries to set the fee percentage", async function () {
    const { contract, _feeRecipient } = await loadFixture(deployFixture);

    const newFeePercentage = 3;

    expect(contract.connect(_feeRecipient)
      .setFeePercentage(newFeePercentage))
      .to
      .be
      .revertedWithCustomError(contract, "OwnableInvalidOwner");
  });

it("Should fail if fee percentage is zero", async function () {
    const { contract, owner } = await loadFixture(deployFixture);

    const invalidFeePercentage = 0;

    await expect(contract.connect(owner)
      .setFeePercentage(invalidFeePercentage))
      .to
      .be
      .revertedWith("Invalid Percentage");
  });

it("Should fail if fee percentage above 10", async function () {
    const { contract, owner } = await loadFixture(deployFixture);

    const invalidFeePercentage = 15;

    await expect(contract.connect(owner)
      .setFeePercentage(invalidFeePercentage))
      .to
      .be
      .revertedWith("Invalid Percentage");
  });

  });

});