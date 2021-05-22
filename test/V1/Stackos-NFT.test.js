const Token = artifacts.require('Token');
const StackosNFT = artifacts.require("StackosNFT");
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants.js');
const { expectEvent } = require("@openzeppelin/test-helpers");
const { assert, expect } = require('chai');

const toWei = _amount => web3.utils.toWei(_amount.toString());

contract("StackosNFT", async ([deployer, user1, user2, user3]) => {
    const _name = "Stackos_NFT";
    const _symbol = "NFT";
    const _tokenURI = "My Token metadata";
    const _price = 12;
    let REGISTRATION_FEE;

    beforeEach(async () => {
        this.token = await Token.new(_name, _symbol, { from: deployer });
        this.stackosNFT = await StackosNFT.new(_name, _symbol, this.token.address, { from: deployer });
        REGISTRATION_FEE = await this.stackosNFT.REGISTRATION_FEE();

        await this.token.transfer(user1, toWei(10000), { from: deployer });
        await this.token.transfer(user2, toWei(10000), { from: deployer });
        await this.token.transfer(user3, toWei(10000), { from: deployer });

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

        it("should set REGISTRATION_FEE", async () => {
            expect(REGISTRATION_FEE.toString()).to.equal(toWei(100));
        })
    })

    describe('createNFT', () => {
        let _reciept;

        beforeEach(async () => {
            await this.token.approve(this.stackosNFT.address, REGISTRATION_FEE, { from: user1 });
            _reciept = await this.stackosNFT.createNFT(_tokenURI, toWei(_price), { from: user1 });
        })

        it("should create new nft", async () => {
            const { owner, tokenId, price } = await this.stackosNFT.nftsToOwners("1", { from: user1 });
            const balanceOfStackosNFT = await this.token.balanceOf(this.stackosNFT.address);

            expect(owner).to.equal(user1);
            expect(tokenId.toString()).to.equal("1");
            expect(price.toString()).to.equal(toWei(_price));
            expect(balanceOfStackosNFT.toString()).to.equal(REGISTRATION_FEE.toString());
        })

        it("should reject if REGISTRATION_FEE is not approved by caller", async () => {
            try {
                await this.stackosNFT.createNFT(_tokenURI, toWei(_price), { from: user1 });
            } catch (error) {
                assert(error.message.includes("ERC20: transfer amount exceeds allowance"));
                return;
            }
            assert(false);
        })

        it("should emit NftCreated event", async () => {
            expectEvent(_reciept, "NftCreated", {
                owner: user1,
                tokenId: "1",
                price: toWei(_price)
            })
        })
    })

    describe('nftsToOwners', () => {
        beforeEach(async () => {
            await this.token.approve(this.stackosNFT.address, REGISTRATION_FEE, { from: user1 });
            this.stackosNFT.createNFT(_tokenURI, toWei(_price), { from: user1 });
        })

        it("should query existing nfts", async () => {
            const { owner, tokenId, price } = await this.stackosNFT.nftsToOwners("1", { from: user1 });

            expect(owner).to.equal(user1);
            expect(tokenId.toString()).to.equal("1");
            expect(price.toString()).to.equal(toWei(_price));
        })

        it("should reject if caller is not the owner", async () => {
            try {
                await this.stackosNFT.nftsToOwners("1", { from: user2 });
            } catch (error) {
                assert(error.message.includes("StackosNFT: Access denied"));
                return;
            }
            assert(false);
        })
    })

    describe('safeTransferFrom', () => {
        let _reciept;

        beforeEach(async () => {
            await this.token.approve(this.stackosNFT.address, REGISTRATION_FEE, { from: user1 });
            this.stackosNFT.createNFT(_tokenURI, toWei(_price), { from: user1 });

            const { price } = await this.stackosNFT.nftsToOwners("1", { from: user1 });
            await this.token.approve(this.stackosNFT.address, price, { from: user2 });

            await this.stackosNFT.approve(user2, "1", { from: user1 });
            _reciept = await this.stackosNFT.safeTransferFrom(user1, user2, "1", { from: user2 });
        })

        it("should transfer nfts between accounts", async () => {
            const ownerOfTokenId = await this.stackosNFT.ownerOf("1");
            const { owner } = await this.stackosNFT.nftsToOwners("1", { from: user2 });

            expect(ownerOfTokenId).to.equal(user2);
            expect(owner).to.equal(user2);
        })

        it("should reject when oldOwner queries data", async () => {
            try {
                await this.stackosNFT.nftsToOwners("1", { from: user1 });
            } catch (error) {
                assert(error.message.includes("StackosNFT: Access denied"));
                return;
            }
            assert(false);
        })

        it("should emit NftOwnershipTransferred event", async () => {
            expectEvent(_reciept, "NftOwnershipTransferred", {
                oldOwner: user1,
                newOwner: user2,
                tokenId: "1"
            })
        })
    })
    
    describe('setRegistrationFee', () => {
        let _newPrice = toWei(10000);

        beforeEach(async () => {
            await this.stackosNFT.setRegistrationFee(_newPrice, { from: deployer });
        })

        it("should update REGISTRATION_FEE", async () => {
            const REGISTRATION_FEE = await this.stackosNFT.REGISTRATION_FEE();
            expect(REGISTRATION_FEE.toString()).to.equal(_newPrice);
        })

        it("should reject if caller is not the deployer", async () => {
            try {
                await this.stackosNFT.setRegistrationFee(_newPrice, { from: user1 });
            } catch (error) {
                assert(error.message.includes("Ownable: caller is not the owner"));
                return;
            }
            assert(false);
        })
    })
    
    describe('setTokenSalePrice', () => {
        let _oldPrice = toWei(10);
        let _newSalePrice = toWei(1000);

        beforeEach(async () => {
            await this.token.approve(this.stackosNFT.address, REGISTRATION_FEE, { from: user1 });
            await this.stackosNFT.createNFT(_tokenURI, _oldPrice, { from: user1 });
            await this.stackosNFT.setTokenSalePrice(_newSalePrice, { from: user1 });
        })

        expect("should update sale price", async () => {
            const { price } = await this.stackosNFT.nftsToOwners("1", { from: user1 });
            expect(price.toString()).to.equal(_newSalePrice);
        })

        expect("should reject if caller is not the owner", async () => {
            try {
                await this.stackosNFT.setTokenSalePrice(_newSalePrice, { from: user2 });
            } catch (error) {
                assert(error.message.includes("StackosNFT: Not a valid owner"));
                return;
            }
            assert(false);
        })
    })
    
})