// SPDX-License-Identofier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StackosNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter public tokenIds;

    IERC20 public tokenContract;
    uint256 public REGISTRATION_FEE;

    mapping(uint256 => Description) private _nftsToOwners;

    struct Description {
        address owner;
        uint256 tokenId;
        uint256 price;
        uint256 timestamp;
        uint256 lastUpdated;
    }

    event NftCreated(address owner, uint256 tokenId, uint256 timestamp);

    constructor(string memory _name, string memory _symbol, IERC20 _tokenAddress) ERC721(_name, _symbol) {
        tokenContract = _tokenAddress;
        REGISTRATION_FEE = 100 ether;
    }

    function createNFT(string memory _tokenURI, uint256 _priceSale) external {
        tokenIds.increment();
        uint256 _id = tokenIds.current();

        _safeMint(_msgSender(), _id);
        _setTokenURI(_id, _tokenURI);

        _nftsToOwners[_id] = Description(_msgSender(), _id, _priceSale, block.timestamp, block.timestamp);
        emit NftCreated(_msgSender(), _priceSale, block.timestamp);
    }


    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) public virtual override {
        _transferOwnership(from, to, tokenId, data);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        _transferOwnership(from, to, tokenId, msg.data);
    }

    function _transferOwnership(address from, address to, uint256 tokenId, bytes calldata data) internal {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "StackosNFT: Action denied");

        tokenContract.transferFrom(to, from, _nftsToOwners[tokenId].price);
        super.safeTransferFrom(from, to, tokenId, data);

        _nftsToOwners[tokenId] = Description(
            to,
            tokenId,
            0,
            _nftsToOwners[tokenId].timestamp,
            block.timestamp
        );
    }

    function setPrice(uint256 _tokenId, uint256 _amount) external {
        require(_msgSender() == _nftsToOwners[_tokenId].owner, "StackosNFT: Not a valid owner");
        _nftsToOwners[_tokenId].price = _amount;
    }

    function nftsToOwners(
        uint256 _tokenId
    ) external view returns(
        address owner, 
        uint256 tokenId, 
        uint256 price, 
        uint256 timestamp, 
        uint256 lastUpdated
    ) {
        require(_msgSender() == ownerOf(_tokenId), "StackosNFT: Access denied");
        Description memory _data = _nftsToOwners[_tokenId];

        return(
            _data.owner,
            _data.tokenId,
            _data.price,
            _data.timestamp,
            _data.lastUpdated
        );
    }
}