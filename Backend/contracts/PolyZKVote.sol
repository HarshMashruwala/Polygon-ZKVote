// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@appliedzkp/semaphore-contracts/base/SemaphoreCore.sol";
import "@appliedzkp/semaphore-contracts/interfaces/IVerifier.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreConstants.sol";
import "../interface/IPolyZKVote.sol";

contract PolyZKVote is IPolyZKVote, SemaphoreCore {
    mapping(uint256 => Group) groups;
    uint256 GroupCount;
    address admin;
    uint256[] identity;
    mapping(uint256 => MemeberToIdentity) memberToidentity;
    mapping(uint256 => MemberToGroup) joinedDAO;
    mapping(uint256 => MemberToGroup) createdDAO;
    mapping(uint256 => ProposalToGroup) proposalTogroup;
    mapping(uint256 => bool) voterAdded;
    mapping(uint256 => mapping(uint256 => MemeberToIdentity)) proposalTovoter;
    mapping(uint256=> mapping(uint256 => bool)) identityToCreatedDAO;
    mapping(uint8 => IVerifier) verifiers;
    mapping(uint256 => mapping(uint256 => Proposal)) proposals;
    mapping(uint256 => mapping(uint256 => uint256)) encryptionKey;
    mapping(uint256 => mapping(uint256 => uint256)) vote;
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bytes32))) userVotes;
    modifier onlySupportedDepth(uint8 depth) {
        require(
            address(verifiers[depth]) != address(0),
            "AnontVote: tree depth is not supported"
        );
        _;
    }

    constructor(Verifier[] memory _verifiers) {
        for (uint8 i = 0; i < _verifiers.length; i++) {
            verifiers[_verifiers[i].merkleTreeDepth] = IVerifier(
                _verifiers[i].contractAddress
            );
        }
        admin = msg.sender;
    }

    modifier onlyAdmin(address _sender) {
        require(admin == _sender, "Sender is not Admin.");
        _;
    }

    modifier onlyCoordinator(uint256 groupId , uint256 pollId) {
        require(proposals[groupId][pollId].coordinator == msg.sender, "PolyVoting: caller is not the poll coordinator");
        _;
    }

    function getRoot(uint256 groupId) internal view returns (uint256) {
        return groups[groupId].root;
    }

    function getDepth(uint256 groupId) internal view returns (uint8) {
        return groups[groupId].depth;
    }

    function getGroup(uint256 groupId) public view override onlyAdmin(msg.sender) returns(Group memory group){
        return(groups[groupId]);
    }

    function getProposal(uint256 groupId,uint256 pollId) public view override onlyAdmin(msg.sender) returns(Proposal memory proposal) {
        return (proposals[groupId][pollId]);
    }

    function updateGroup(Group calldata _group,uint256 _groupId,uint256 _identity,bool _type) public override onlyAdmin(msg.sender)
    {   
        groups[_groupId] = _group;

        if (_groupId == 1) {
            identity.push(_identity);
        } else {

            if(_type == true){
                
                createdDAO[_identity].groupId.push(_groupId);
                identityToCreatedDAO[_identity][_groupId] = true;
            }
            memberToidentity[_groupId].identity.push(_identity);
            joinedDAO[_identity].groupId.push(_groupId);
            
        }
    }

    // function addIdentity(uint256 _identity) public override onlyAdmin(msg.sender) {
    //     identity.push(_identity);
    // }

    // function addMemberToGroup(uint256 groupId,uint256 _identity) public override onlyAdmin(msg.sender) {
    //     memberToidentity[groupId].identity.push(_identity);
    //     joinedDAO[_identity].groupId.push(groupId);
    // }

    function getJoinedDAOMember(uint256 _identity) public view override onlyAdmin(msg.sender) returns(uint256[] memory _allGroup){
        return(joinedDAO[_identity].groupId);
    }
    function getCreatedDAOMember(uint256 _identity) public view override onlyAdmin(msg.sender) returns(uint256[] memory _allGroup){
        return(createdDAO[_identity].groupId);
    }

    function getGroupProposal(uint256 _groupId) public view override onlyAdmin(msg.sender) returns(uint256[] memory _allProposal) {
        return(proposalTogroup[_groupId].proposalId);
    }

    function getProposalTovoter(uint256 _groupId,uint256 _pollId) public view override onlyAdmin(msg.sender) returns(uint256[] memory _allVoter) {
        return(proposalTovoter[_groupId][_pollId].identity);
    }

    function addedVoterStatus(uint256 _pollId) public view override onlyAdmin(msg.sender) returns(bool status){
        return(voterAdded[_pollId]);
    }

    function getIdentity() public view override onlyAdmin(msg.sender) returns(uint256[] memory _allIdentity){
        return (identity);
    }

    function getMemberToGroup(uint256 groupId) public view override onlyAdmin(msg.sender) returns (uint256[] memory _groupMember){
        return(memberToidentity[groupId].identity);
    }

    function createPoll(
        uint256 _identity,
        uint256 groupId,
        uint256 _pollId,
        Proposal calldata _proposal
    ) public override {

        require(identityToCreatedDAO[_identity][groupId],"PolyVoting:Only DAO creater make proposal");

        proposals[groupId][_pollId] = _proposal;
        proposalTogroup[groupId].proposalId.push(_pollId);
    }

    function addVoter(uint256 groupId,uint256 pollId, uint256 _root) public override onlyCoordinator(groupId,pollId) {
        require(proposals[groupId][pollId].state == PollState.Created, "PolyVoting: voters can only be added before voting");
        require(!voterAdded[pollId],"PolyVoting: voters already added.");


        voterAdded[pollId] = true;
        proposals[groupId][pollId].root = _root;
    }

    
    function startPoll(uint256 groupId,uint256 pollId, uint256 _encryptionKey) public override onlyCoordinator(groupId,pollId) {
        require(proposals[groupId][pollId].state == PollState.Created, "PolyVoting: poll has already been started");

        proposals[groupId][pollId].state = PollState.Ongoing;
        encryptionKey[groupId][pollId] = _encryptionKey;

    }

    function castVote(
        bytes32 _vote,
        uint256 _identity,
        uint256 nullifierHash,
        uint256 pollId,
        uint256 groupId,
        uint256[8] calldata proof
    ) public override onlyAdmin(msg.sender) {
        Proposal memory _proposal = proposals[groupId][pollId];

        require(_proposal.state == PollState.Ongoing, "PolyVoting: vote can only be cast in an ongoing poll");

        uint8 depth = _proposal.depth;
        uint256 root = _proposal.root;
        IVerifier verifier = verifiers[depth];

        _verifyProof(_vote, root, nullifierHash, pollId, proof, verifier);

        // Prevent double-voting (nullifierHash = hash(pollId + identityNullifier)).
        _saveNullifierHash(nullifierHash);
        vote[groupId][pollId] += 1;
        userVotes[_identity][groupId][pollId] = _vote;

    }

    function endPoll(uint256 groupId,uint256 pollId, uint256 decryptionKey) public override onlyCoordinator(groupId,pollId) {
        require(proposals[groupId][pollId].state == PollState.Ongoing, "PolyVoting: poll is not ongoing");
        require(encryptionKey[groupId][pollId] == decryptionKey,"PolyVoting: wrong encryptionKey");
        proposals[groupId][pollId].state = PollState.Ended;

        
    }

    function getVote(uint256 groupId,uint256 pollId) public view override onlyAdmin(msg.sender) returns(uint256 _vote){
        require(proposals[groupId][pollId].state == PollState.Ended,"PolyVoting: poll is not ended");
        return vote[groupId][pollId];
    }

    function getUserRating(uint256 _identity,uint256 groupId,uint256 pollId) public view override onlyAdmin(msg.sender) returns(bytes32 _vote){
        return userVotes[_identity][groupId][pollId];
    }
}
