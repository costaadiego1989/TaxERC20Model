import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
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
  });
});