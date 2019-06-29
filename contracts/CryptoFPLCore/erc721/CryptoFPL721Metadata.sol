pragma solidity^0.5.0;

import "./CryptoFPL721BaseEnumerable.sol";
import "../../erc/erc721/IERC721Metadata.sol";
import "../../utils/Strings.sol";

contract CryptoFPL721Metadata is CryptoFPL721BaseEnumerable, IERC721Metadata {
  string private _name;
  string private _symbol;
  string private _tokenMetadataBaseURI;
  using Strings for string;

  mapping(uint256 => string) private _tokenURIs;

  bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
  /**
    * 0x5b5e139f ===
    *     bytes4(keccak256('name()')) ^
    *     bytes4(keccak256('symbol()')) ^
    *     bytes4(keccak256('tokenURI(uint256)'))
    */

  constructor () internal {
    _name = "CryptoFPL";
    _symbol = "FPL";
    _tokenMetadataBaseURI = "http://localhost:4001/api/players/";
    _registerInterface(_INTERFACE_ID_ERC721_METADATA);
  }

  function name() external view returns (string memory) {
    return _name;
  }

  function symbol() external view returns (string memory) {
    return _symbol;
  }

  //TODO: fix to be consistant with api
  function tokenURI(uint256 tokenId) external view returns (string memory) {
    require(_exists(tokenId));
    _tokenURIs[tokenId];
    return Strings.strConcat(
      _tokenMetadataBaseURI,
      Strings.uint2str(tokenId)
    );
  }

  //TODO: fix to be consistant with api
  function _setTokenURI(uint256 tokenId, string memory uri) internal {
    require(_exists(tokenId));
    _tokenURIs[tokenId] = uri; 
  }

  function _burn(address owner, uint256 tokenId) internal {
    super._burn(tokenId);

    // Clear metadata (if any)
    if (bytes(_tokenURIs[tokenId]).length != 0) {
      delete _tokenURIs[tokenId];
    }
  }
}