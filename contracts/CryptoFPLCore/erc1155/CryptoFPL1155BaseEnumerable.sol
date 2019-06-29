pragma solidity ^0.5.0;

import "../../erc/erc1155/ERC1155.sol";

contract CryptoFPL1155BaseEnumerable is ERC1155 {
  
  // @dev Mapping from owner to list of owned token IDs.
  mapping (address => uint256[]) private _ownedTokens;

  // @dev Mapping from token ID to index in the owned token list.
  mapping (uint256 => uint256) private _ownedTokenIndex;

  // Returns the list of tokenIDs owned by a given address
  function ownedTokens(address owner) public view returns (uint256[] memory) {
    require(owner != address(0));
    return _ownedTokens[owner];
  }

  // Add a single tokenID to a user's ownedTokens list
  function _addTokenTo(address _to, uint256 _tokenId) internal {
    require(_to != address(0));
    uint256 length = _ownedTokens[_to].length;
    if (balances[_to][_tokenId] == 0) {
        _ownedTokens[_to].push(_tokenId);
        _ownedTokenIndex[_tokenId] = length;
      } 
  }
  
  // Add multiple tokenIDs to a user's ownedTokens list
  function _addTokensTo(address _to, uint256[] memory _tokenIds) internal {
    require(_to != address(0));
    uint256 length;
    for (uint i = 0; i < _tokenIds.length; i++) {
      length = _ownedTokens[_to].length;
      if (balances[_to][_tokenIds[i]] == 0) {
        _ownedTokens[_to].push(_tokenIds[i]);
        _ownedTokenIndex[_tokenIds[i]] = length;
      } 
    }
  }

  // Remove a single tokenID from a user's ownedTokens list
  function _removeTokenFrom(address _from, uint256 _tokenId) internal {
    require(_from != address(0));
    
    uint256 _tokenIndex = _ownedTokenIndex[_tokenId];
    uint256 _lastTokenIndex = _ownedTokens[_from].length.sub(1);
    uint256 _lastTokenId = _ownedTokens[_from][_lastTokenIndex];

    if (balances[_from][_tokenId] == 1) {
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
  }

}