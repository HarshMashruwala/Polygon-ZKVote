// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IPolyZKVote {

struct Verifier {
    address contractAddress;
    uint8 merkleTreeDepth;
}

enum GroupState {
    deactive,
    active
}

enum PollState {
    Created,
    Ongoing,
    Ended
}

struct Group {
    bytes32 provider;
    bytes32 name;
    uint256 root;
    uint256 channelID;
    uint8 depth;
    string CID;
    string role;
}

struct Proposal {
    bytes32 name;
    uint256 root;
    address coordinator;
    uint8 depth;
    string CID;
    PollState state;
}

struct MemeberToIdentity {
    uint256[] identity;
}

struct MemberToGroup {
    uint256[] groupId;
}

struct ProposalToGroup {
    uint256[] proposalId;
}

function getGroup(uint256 groupId) external view  returns(Group memory group);

function getProposal(uint256 groupId,uint256 pollId) external view   returns(Proposal memory proposal);

function updateGroup(Group calldata _group,uint256 _groupId,uint256 _identity,bool _type) external;

// function addIdentity(uint256 _identity) external  ;

// function addMemberToGroup(uint256 groupId,uint256 _identity) external  ;

function getIdentity() external  view returns(uint256[] memory _allIdentity);

function getJoinedDAOMember(uint256 _identity) external view  returns(uint256[] memory _allGroup);

function getCreatedDAOMember(uint256 _identity) external view  returns(uint256[] memory _allGroup);

function getGroupProposal(uint256 _groupId) external view  returns(uint256[] memory _allProposal);

function getMemberToGroup(uint256 groupId) external view returns (uint256[] memory _groupMember);

function getProposalTovoter(uint256 _groupId,uint256 _pollId) external view  returns(uint256[] memory _allVoter);

function addedVoterStatus(uint256 _pollId) external view returns(bool status);

function createPoll(uint256 identity,uint256 groupId,uint256 _pollId,Proposal calldata _proposal) external;

function addVoter(uint256 groupId,uint256 pollId, uint256 _root) external  ;

function startPoll(uint256 groupId,uint256 pollId, uint256 _encryptionKey) external  ;

function castVote(bytes32 vote,uint256 identity,uint256 nullifierHash,uint256 pollId,uint256 groupId,uint256[8] calldata proof) external  ;

function endPoll(uint256 groupId,uint256 pollId, uint256 decryptionKey) external  ;

function getVote(uint256 groupId,uint256 pollId) external view returns(uint256 _vote);

function getUserRating(uint256 identity,uint256 groupId,uint256 pollId) external view  returns(bytes32 _vote);

}