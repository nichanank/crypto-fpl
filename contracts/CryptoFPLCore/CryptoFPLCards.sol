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
  mapping(address => uint) refunds; // Keeps track of refunds for players to withdraw from in case they deposited too much.

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

  /// Fallback function
  function () external payable {

  }

  /// Allows league admin to withdraw funds from the contract.
  function withdrawFunds() external onlyOwner() {
    uint availableFunds = address(this).balance;
    msg.sender.transfer(availableFunds);
  }

  /// Lets the user withdraw the refund in case of overpayment
  function withdrawRefund() external {
    uint refund = refunds[msg.sender];
    refunds[msg.sender] = 0;
    msg.sender.transfer(refund);
  }

  /// Retrieves the Position of a footballer
  /// @param tokenId of the footballer in question
  /// @return the Position enum of the footballer
  function positionOf(uint tokenId) external view returns(Position) {
    return positions[tokenId];
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

  /// Mints footballer card pack to a user
  /// @param _owner address to mint to
  /// @param ids of the footballers, as per the FPL API
  /// @param playerPositions of the footballers 1 = GK, 2 = DEF, 3 = MID, 4 = FWD
  /// @param amounts to mint for each footballer ID
  function mintTeam(address _owner, uint[] memory ids, uint[] memory playerPositions, uint[] memory amounts) public payable {
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
    uint change = msg.value - CARDPACK_PRICE;
    refunds[msg.sender] += change;
    emit LogTeamMinted(ids, _owner);
  }
  
  /// Updates the position of a footballer
  /// @param tokenId of the footballer
  /// @param position of the footballer to be updated to
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


}