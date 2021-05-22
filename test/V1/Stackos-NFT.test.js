const Token = artifacts.require('Token');
const StackosNFT = artifacts.require("StackosNFT");
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants.js');
const { expect } = require('chai');

const toWei = _amount => web3.utils.toWei(_amount.toString());

contract("StackosNFT", async ([deployer, user1, user2]) => {
    const _name = "";
    const _symbol = "";

    beforeEach(async () => {
        this.token = await Token.new(_name, _symbol, { from: deployer });
        this.stackosNFT = await StackosNFT.new(_name, _symbol, this.token.address, { from: deployer });
    })

    describe('deployement', async () => {
        it("should deploy contract properly", async () => {
            expect(this.token.address).not.equal(ZERO_ADDRESS);
            expect(this.token.address).not.equal("");
            expect(this.token.address).not.equal(undefined);
            expect(this.token.address).not.equal(null);

            expect(this.stackosNFT.address).not.equal(ZERO_ADDRESS);
            expect(this.stackosNFT.address).not.equal("");
            expect(this.stackosNFT.address).not.equal(undefined);
            expect(this.stackosNFT.address).not.equal(null);
        })
    })

    describe('createNFT', () => {
        const _tokenURI = "";
        const _price = 12;
        let _reciept;

        beforeEach(async () => {
            _reciept = await this.stackosNFT.createNFT(_tokenURI, toWei(_price), { from: user1 });
        })

        it("should create new nft", async () => {
            const { owner, tokenId, price } = await this.stackosNFT.nftsToOwners("1", { from: user1 });

            expect(owner).to.equal(user1);
            expect(tokenId.toString()).to.equal("1");
            expect(price.toString()).to.equal(toWei(_price));
        })
    })
    
})