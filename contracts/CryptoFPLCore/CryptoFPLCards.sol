pragma solidity ^0.5.0;

    /// @author Nichanan Kesonpat
    /// @title Base multi-fungible token contract for cards of CryptoFPL. A PvP card game based on Fantasy Premier League.

import "../utils/Ownable.sol";
import "../erc/erc1155/ERC1155MintBurn.sol";
import "../erc/erc1155/ERC1155Metadata.sol";
import "./erc1155/CryptoFPL1155BaseEnumerable.sol";

contract CryptoFPLCards is Ownable, ERC1155MintBurn, ERC1155Metadata, CryptoFPL1155BaseEnumerable {
  
  //Storage variables
  uint32 public season;
  uint CARDPACK_PRICE = 100000000000000000 wei;
  uint CARDPACK_SIZE = 10;

  //Structs and Enums
  enum Position {
    Goalkeeper,
    Defender,
    Midfielder,
    Forward
  }

  enum Rating {
    Rookie,
    RisingStar,
    FirstTeam,
    MVP
  }
  
  struct Footballer {
    Rating rating;
    Position position;
    uint32 season;
  }

  //Maps tokenID to player position
  mapping(uint => Position) public positions;
  mapping(uint => Rating) public ratings;
  mapping(uint => bool) private positionInitialized; //Only updates footballer positions for new ids.

  //Events
  // event PlayerMinted(uint id, Position position, address owner);
  event LogTeamMinted(uint256[] ids, address owner);

  //Modifiers
  modifier onlyOwner { require (msg.sender == this.owner()); _;}

  //Functions
  constructor(uint32 _season) public {
    _setBaseMetadataURI("http://localhost:4001/api/footballers/");
    season = _season;
  }

  function name() public pure returns(string memory) {
    return 'CryptoFPL';
  }

  function symbol() public pure returns(string memory) {
    return 'FPL';
  }

  function viewCardPackPrice() public view returns(uint price) {
    return CARDPACK_PRICE;
  }

  //Mints footballer card pack to a user
  function mintTeam(address _owner, uint[] calldata ids, uint[] calldata playerPositions, uint[] calldata amounts) external payable {
    require(msg.value >= CARDPACK_PRICE, "Insufficient funds to mint team");
    require (ids.length != CARDPACK_SIZE, "Invalid number of cards in pack");
    require (ids.length == playerPositions.length, "Player ids and positions array size mismatch");
    require (ids.length == amounts.length, "Player ids and amounts to mint array size mismatch");
    // require (msg.sender == _owner);
    _addTokensTo(_owner, ids);
    _batchMint(_owner, ids, amounts);
  
    for (uint i = 0; i < ids.length; i++) {
      if (!positionInitialized[ids[i]]) {
        _updatePosition(ids[i], playerPositions[i]);
        positionInitialized[ids[i]] = true;
      }
    }

    uint change = msg.value - (CARDPACK_PRICE);
    msg.sender.transfer(change);
    emit LogTeamMinted(ids, _owner);
  }
  
  function _updatePosition(uint tokenId, uint position) private {
    require(position == 1 || position == 2 || position == 3 || position == 4);
    
    // Positions are 1-indexed in server but 0-indexed as Enums.  
    if (position == 1) {
      positions[tokenId] = Position.Goalkeeper;
    } else if (position == 2) {
      positions[tokenId] = Position.Defender;
    } else if (position == 3) {
      positions[tokenId] = Position.Midfielder;
    } else {
      positions[tokenId] = Position.Forward;
    }
  }

  function positionOf(uint tokenId) external view returns(Position) {
    return positions[tokenId];
  }

  /// Fallback function
    function() external payable {

    }

}