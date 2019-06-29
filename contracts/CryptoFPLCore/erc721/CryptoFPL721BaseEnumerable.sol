pragma solidity ^0.5.0;

import "../../utils/SafeMath.sol";
import "../../erc/erc165/ERC165.sol";
import "../../erc/erc721/ERC721.sol";
import "../../erc/erc721/IERC721.sol";
import "../../erc/erc721/IERC721Enumerable.sol";
import "../../erc/erc721/IERC721Receiver.sol";

contract CryptoFPL721BaseEnumerable is ERC165, IERC721, IERC721Enumerable {
  
  using SafeMath for uint256;

  // @dev Total amount of tokens.
  uint256 private _totalTokens;

  // @dev Mapping from token index to ID.
  mapping (uint256 => uint256) private _overallTokenId;

  // @dev Mapping from token ID to index.
  mapping (uint256 => uint256) private _overallTokenIndex;

  // @dev Mapping from token ID to owner.
  mapping (uint256 => address) private _tokenOwner;

  // @dev Mapping from token ID to approved address.
  mapping (uint256 => address) private _tokenApprovals;

  // @dev Mapping from owner to list of owned token IDs.
  mapping (address => uint256[]) private _ownedTokens;

  // @dev Mapping from owner to number of owned token -- we are going to use _ownedTokens[address].length instead.
  mapping (address => uint256) private _ownedTokensCount;

  // @dev Mapping from owner to operator approvals
  mapping (address => mapping (address => bool)) private _operatorApprovals;

  // @dev For a given owner and a given operator, store whether the operator is allowed to manage tokens on behalf of the owner.
  mapping (address => mapping (address => bool)) private _tokenOperator;

  // @dev Mapping from token ID to index in the owned token list.
  mapping (uint256 => uint256) private _ownedTokenIndex;

  uint private _nextTokenId = 0;
  
  bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
  
  constructor() internal {
    // supportedInterfaces[0x6466353c] = true; // ERC-721 Base
    // supportedInterfaces[0x780e9d63] = true; // ERC-721 Enumerable
    _registerInterface(_INTERFACE_ID_ERC721);
  }

  modifier mustBeValidToken(uint256 _tokenId) {
    require(_tokenOwner[_tokenId] != address(0));
    _;
  }

  function _isTokenOwner(address _addressToCheck, uint256 _tokenId) private view returns (bool) {
    return _tokenOwner[_tokenId] == _addressToCheck;
  }

  function _isApproved(address _addressToCheck, uint256 _tokenId) private view returns (bool) {
    return _tokenApprovals[_tokenId] == _addressToCheck;
  }

  modifier onlyTokenOwner(uint256 _tokenId) {
    require(_isTokenOwner(msg.sender, _tokenId));
    _;
  }

  // ERC-721 Base

  //Returns number of tokens owned by a given address
  function balanceOf(address _owner) public view returns (uint256) {
    require(_owner != address(0));
    return _ownedTokens[_owner].length;
  }

  //Returns the list of NFTs owned by a given address
  function ownedTokens(address owner) public view returns (uint256[] memory) {
    require(owner != address(0));
    return _ownedTokens[owner];
  }

  //Returns the owner of a given NFT ID.
  function ownerOf(uint256 _tokenId) public view mustBeValidToken(_tokenId) returns (address) {
    return _tokenOwner[_tokenId];
  }

  function _addTokenTo(address _to, uint256 _tokenId) private {
    require(_to != address(0));

    _tokenOwner[_tokenId] = _to;

    uint256 length = _ownedTokens[_to].length;
    _ownedTokens[_to].push(_tokenId);
    _ownedTokenIndex[_tokenId] = length;
  }
  
  function _mint(address _to, uint256 _tokenId) internal {
    require(_tokenOwner[_tokenId] == address(0));

    _addTokenTo(_to, _tokenId);

    _overallTokenId[_totalTokens] = _tokenId;
    _overallTokenIndex[_tokenId] = _totalTokens;
    _totalTokens = _totalTokens.add(1);
    _nextTokenId = _tokenId + 1;
    emit Transfer(address(0), _to, _tokenId);
  }

  function getNextTokenId() internal returns (uint) {
    return _nextTokenId;
  }

  function _removeTokenFrom(address _from, uint256 _tokenId) private {
    require(_from != address(0));

    uint256 _tokenIndex = _ownedTokenIndex[_tokenId];
    uint256 _lastTokenIndex = _ownedTokens[_from].length.sub(1);
    uint256 _lastTokenId = _ownedTokens[_from][_lastTokenIndex];

    _tokenOwner[_tokenId] = address(0);

    // Insert the last token into the position previously occupied by the removed token.
    _ownedTokens[_from][_tokenIndex] = _lastTokenId;
    _ownedTokenIndex[_lastTokenId] = _tokenIndex;

    // Resize the array.
    delete _ownedTokens[_from][_lastTokenIndex];
    _ownedTokens[_from].length--;

    // Remove the array if no more tokens are owned to prevent pollution.
    if (_ownedTokens[_from].length == 0) {
      delete _ownedTokens[_from];
    }

    // Update the index of the removed token.
    delete _ownedTokenIndex[_tokenId];
  }

  function _exists(uint256 _tokenId) internal view returns (bool) {
    address owner = _tokenOwner[_tokenId];
    return owner != address(0);
  }

  function _burn(uint256 _tokenId) internal {
    address _from = _tokenOwner[_tokenId];

    require(_from != address(0));

    _removeTokenFrom(_from, _tokenId);
    _totalTokens = _totalTokens.sub(1);

    uint256 _tokenIndex = _overallTokenIndex[_tokenId];
    uint256 _lastTokenId = _overallTokenId[_totalTokens];

    delete _overallTokenIndex[_tokenId];
    delete _overallTokenId[_totalTokens];
    _overallTokenId[_tokenIndex] = _lastTokenId;
    _overallTokenIndex[_lastTokenId] = _tokenIndex;

    emit Transfer(_from, address(0), _tokenId);
  }

  function _isContract(address _address) private view returns (bool) {
    uint _size;
    // solium-disable-next-line security/no-inline-assembly
    assembly { _size := extcodesize(_address) }
    return _size > 0;
  }

  function _transferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data, bool _check) internal mustBeValidToken(_tokenId) {
    require(_isTokenOwner(_from, _tokenId));
    require(_to != address(0));
    require(_to != _from);

    _removeTokenFrom(_from, _tokenId);

    delete _tokenApprovals[_tokenId];
    emit Approval(_from, address(0), _tokenId);

    _addTokenTo(_to, _tokenId);

    if (_check && _isContract(_to)) {
      IERC721Receiver(_to).onERC721Received.gas(50000)(msg.sender, _from, _tokenId, _data);
    }

    emit Transfer(_from, _to, _tokenId);
  }
  
  function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
    return bytes4(keccak256("onERC721Received(address,uint256,bytes)"));
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public {
    _transferFrom(_from, _to, _tokenId, _data, true);
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId) public {
    _transferFrom(_from, _to, _tokenId, "", true);
  }

  function transferFrom(address _from, address _to, uint256 _tokenId) public {
    _transferFrom(_from, _to, _tokenId, "", false);
  }

  function approve(address _approved, uint256 _tokenId) public mustBeValidToken(_tokenId) {
    address _owner = _tokenOwner[_tokenId];

    require(_owner != _approved);
    require(_tokenApprovals[_tokenId] != _approved);

    _tokenApprovals[_tokenId] = _approved;

    emit Approval(_owner, _approved, _tokenId);
  }

  function setApprovalForAll(address _operator, bool _approved) public {
    require(_tokenOperator[msg.sender][_operator] != _approved);
    _tokenOperator[msg.sender][_operator] = _approved;
    emit ApprovalForAll(msg.sender, _operator, _approved);
  }

  function getApproved(uint256 _tokenId) public view mustBeValidToken(_tokenId) returns (address) {
    return _tokenApprovals[_tokenId];
  }

  function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
    return _tokenOperator[_owner][_operator];
  }

  // ERC-721 Enumerable

  function totalSupply() public view returns (uint256) {
    return _totalTokens;
  }

  function tokenByIndex(uint256 _index) public view returns (uint256) {
    require(_index < _totalTokens);
    return _overallTokenId[_index];
  }

  function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256 _tokenId) {
    require(_owner != address(0));
    require(_index < _ownedTokens[_owner].length);
    return _ownedTokens[_owner][_index];
  }
}