import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Tax", function () {
  // Fixture para deploy do contrato
  async function deployFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Tax = await hre.ethers.getContractFactory("Tax");
    const tax = await Tax.deploy();

    return { tax, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { tax, owner, otherAccount } = await loadFixture(deployFixture);
      
      expect(await tax.owner()).to.equal(owner.address);
    });
  });
});