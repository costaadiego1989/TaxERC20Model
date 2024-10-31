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

  });

});