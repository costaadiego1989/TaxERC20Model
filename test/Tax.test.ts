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
    const [owner, _feeRecipient] = await hre.ethers.getSigners();

    const Tax = await hre.ethers.getContractFactory("Tax");
    const contract = await Tax.deploy(tokenName, tokenSymbol, _feeRecipient);

    return { contract, owner, _feeRecipient };
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

    await expect(contract.burn(burnAmount)).to.be.revertedWith("Insufficient Balance");
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

  });

});