import React, { useState,useEffect } from 'react'
import PolyZKVote from '../script/PolyZKVote'
import MetaMaskOnboarding from '@metamask/onboarding';
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { utils } from "ethers"
import web3 from '../script/web3_'
import {
    generateProof,
    packToSolidityProof
} from "@semaphore-protocol/proof"

const wasmFilePath = window.location.origin+"/semaphore.wasm"
const zkeyFilePath = window.location.origin+"/semaphore.zkey"

// console.log(wasmFilePath)

function ViewProposal(props) {

    const [startEncKey, setStartEncKey] = useState('')
    const [endEncKey, setEndEncKey] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [totalVote, setTotalVote] = useState('')
    const [totalVoter, setTotalVoter] = useState('')
    const [percentage,setPercentage] = useState('')
    const [accounts, setAccounts] = useState('');
    const [proposalId,setProposalId] = useState('')


    useEffect(() => {
        function handleNewAccounts(newAccounts) {
            setAccounts(newAccounts);
        }
        async function onboarding(){
            if (MetaMaskOnboarding.isMetaMaskInstalled()) {
                await window.ethereum
                    .request({ method: 'eth_requestAccounts' })
                    .then(handleNewAccounts);
                await window.ethereum.on('accountsChanged', handleNewAccounts);
                return async () => {
                    await window.ethereum.off('accountsChanged', handleNewAccounts);
                };
            }
        }
        onboarding()
    }, []);

    useEffect(()=>{
        const startPollModal = document.getElementById('startPollModal')
        startPollModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget
            // Extract info from data-bs-* attributes
            const proposalId = button.getAttribute('data-bs-whatever')
            // console.log(proposalId)
            setProposalId(proposalId)
            setErrorMessage('')
        })
        const endPollModal = document.getElementById('endPollModal')
        endPollModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget
            // Extract info from data-bs-* attributes
            const proposalId = button.getAttribute('data-bs-whatever')
            // console.log(proposalId)
            setProposalId(proposalId)
            setErrorMessage('')
        })
        const viewResultModal = document.getElementById('viewResultModal')
        viewResultModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget
            // Extract info from data-bs-* attributes
            const proposalId = button.getAttribute('data-bs-whatever')
            // console.log(proposalId)
            setProposalId(proposalId)
            setPercentage('')
            setTotalVote('')
            setTotalVoter('')
            setErrorMessage('')
        })
        const voteModal = document.getElementById('voteModal')
        voteModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget
            // Extract info from data-bs-* attributes
            const proposalId = button.getAttribute('data-bs-whatever')
            // console.log(proposalId)
            setProposalId(proposalId)
            setErrorMessage('')
        })
        const voterModal = document.getElementById('voterModal')
        voterModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget
            // Extract info from data-bs-* attributes
            const proposalId = button.getAttribute('data-bs-whatever')
            // console.log(proposalId)
            setProposalId(proposalId)
            setErrorMessage('')
        })
    },[])


    async function addVoter(event) {
        event.preventDefault()
        setLoading(false)
        setErrorMessage('')
        await fetch(`${process.env.REACT_APP_RELAYURL}getMemberToGroup`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupIdentity: props.DAOIdentity })
        }).then(result => result.json()).then(async response => {
            const _allIdentity = response.identity
            const group = new Group(16)

            if (_allIdentity.length > 0) {
                group.addMembers(_allIdentity)
            }
            console.log(_allIdentity)
            const root = group.root.toString()
            // console.log(props.account)
            try {
                const result = await PolyZKVote.methods.addVoter(props.DAOIdentity.toString(), proposalId.toString(), root).send({from:accounts[0]})
                // console.log(result)
                setErrorMessage('Voter added successfully.')
                window.location.reload()
            } catch (error) {
                // console.log(error)
                setErrorMessage('Something went wrong.')
            }


        }).catch(err => {
            // console.log(err)
            setErrorMessage('Something went wrong.')
        })
    }

    async function startPoll(event) {
        event.preventDefault()
        setErrorMessage('')
        setLoading(false)
        // console.log(proposalId)
        try {
            const result = await PolyZKVote.methods.startPoll(props.DAOIdentity.toString(), proposalId.toString(), startEncKey)
                .send({ from: props.account })
            // console.log(result)
            setErrorMessage("Poll started successfully.")
            window.location.reload()
        } catch (error) {
            // console.log(error)
            setErrorMessage("Opps!Somthing went wrong.")
        }
        setLoading(true)
    }
    async function endPoll(event) {
        event.preventDefault()
        setErrorMessage('')
        // console.log(proposalId)
        setLoading(false)
        try {
            const result = await PolyZKVote.methods.endPoll(props.DAOIdentity.toString(), proposalId.toString(), endEncKey)
                .send({ from: props.account })
            // console.log(result)
            setErrorMessage("Poll ended successfully.")
            window.location.reload()
        } catch (error) {
            // console.log(error)
            setErrorMessage("Opps!Somthing went wrong.")
        }
        setLoading(true)
    }

    async function viewResult(event) {
        event.preventDefault()
        setErrorMessage('')
        setLoading(false)
        // console.log(proposalId)
        let _totalVote,_totalVoter 
        await fetch(`${process.env.REACT_APP_RELAYURL}getMemberToGroup`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupIdentity: props.DAOIdentity })
        }).then(result => result.json()).then(response => {
            // console.log(response)
            const _allIdentity = response.identity
            setTotalVoter(_allIdentity.length)
            _totalVoter = _allIdentity.length
        }).catch(err => {
            // console.log(err)
            setErrorMessage('Opps!Something went wrong.')
        })
        await fetch(`${process.env.REACT_APP_RELAYURL}getVote`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupIdentity: props.DAOIdentity,
                proposalIdentity: proposalId.toString()
            })
        }).then(result => result.json()).then(response => {
            // console.log(response)
            setTotalVote(response.TotalVote)
            _totalVote = response.TotalVote
        }).catch(err => {
            // console.log(err)
            setErrorMessage('Opps!Something went wrong.')
        })
        const _per = (100*_totalVote)/_totalVoter
        setPercentage(_per)
        setLoading(true)
    }

    async function castVote(event){
        event.preventDefault()
        setLoading(false)
        setErrorMessage('')
//         console.log(props.userIdentity)
        const _usermessage = web3.utils.soliditySha3("Discord", props.userIdentity)
        const _userIdentity = new Identity(_usermessage)
        const vote = "1"
        const bytes32Vote = utils.formatBytes32String(vote)
        await fetch(`${process.env.REACT_APP_RELAYURL}getMemberToGroup`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupIdentity: props.DAOIdentity })
        }).then(result => result.json()).then(async response => {
            const _allIdentity = response.identity
            const group = new Group(16)

            if (_allIdentity.length > 0) {
                group.addMembers(_allIdentity)
            }
//             console.log(_allIdentity)
            //console.log(_userIdentity)
            const fullProof = await generateProof(_userIdentity, group, proposalId.toString(), vote, {
                wasmFilePath,
                zkeyFilePath
            })
            const publicSignals = fullProof.publicSignals
            const solidityProof = packToSolidityProof(fullProof.proof)

            await fetch(`${process.env.REACT_APP_RELAYURL}castVote`,{
                method:"POST",
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({
                    vote:bytes32Vote,
                    identity:props.userIdentity,
                    nullifierHash:publicSignals.nullifierHash,
                    pollId:proposalId.toString(),
                    groupId:props.DAOIdentity,
                    proof:solidityProof
                })
            }).then(result=>result.json()).then(response=>{
                // console.log(response)
                if(response.result === "Success"){
                    setErrorMessage("Successfully added your vote.")
                    window.location.reload()
                }
                else {
                    setErrorMessage(response.error)  
                }
            }).catch(err=>{
                // console.log(err)
                setErrorMessage("Opps!Something went wrong.")
            })
        })
        setLoading(true)

    }

    return (
        <div className="card shadow border-dark m-2">
            <div className="card-header">{props.name}</div>
            <div className="card-body text-secondary">
                <h6 className="card-title">Proposal Overview</h6>
                <p className="card-text">{props.overview}</p>
                <div className='row' >
                    <div className='d-flex align-items-center flex-wrap'>
                        <button type="button" className="btn btn-primary m-2 p-2" data-bs-toggle="modal" data-bs-target="#proposalModal" data-bs-whatever={props.proposalId}>View Details</button>
                        <button type="button" className="btn btn-dark m-2 p-2" hidden={!props.type || (props.status === "Ended") || (props.voterAddedStatus)} data-bs-toggle="modal" data-bs-target="#voterModal" data-bs-whatever={props.proposalId}>Add Voter</button>
                        <button type="button" className="btn btn-success m-2 p-2" hidden={!props.type || (props.status === "Ongoing") || (props.status === "Ended") || (!props.voterAddedStatus)} data-bs-toggle="modal" data-bs-target="#startPollModal" data-bs-whatever={props.proposalId}>Start Poll</button>
                        <button type="button" className="btn btn-danger m-2 p-2" hidden={!props.type || (props.status === "Created") || (props.status === "Ended") || (!props.voterAddedStatus)} data-bs-toggle="modal" data-bs-target="#endPollModal" data-bs-whatever={props.proposalId}>End Poll</button>
                        <button type="button" className="btn btn-secondary m-2 p-2" hidden={(props.status === "Ended") || (props.status === "Created")} data-bs-toggle="modal" data-bs-target="#voteModal" data-bs-whatever={props.proposalId}>
                            Vote</button>
                        <button type="button" className="btn btn-success m-2 p-2" hidden={!(props.status === "Ended") } data-bs-toggle="modal" data-bs-target="#viewResultModal" data-bs-whatever={props.proposalId}>View Result</button>
                        <div className='border border-secondary m-2 p-2 rounded'>{props.status}</div>
                        <div className='border border-secondary m-2 p-2 rounded'>{props.startDate}</div>
                        <span> - </span>
                        <div className='border border-secondary m-2 p-2 rounded'>{props.endDate}</div>
                    </div>
                </div>
            </div>
            {/* Start Poll Modal */}
            <div className="modal fade" id="startPollModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="DAOLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={startPoll}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="startPollLabel">Start Poll</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="startEncryptionKeyInput" className="form-label">Encryption Key</label>
                                    <input type="number" className="form-control" id="startEncryptionKeyInput" placeholder="123456"
                                        value={startEncKey}
                                        onChange={event => setStartEncKey(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <span className="text-danger" hidden={!errorMessage}>{errorMessage}</span>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" disabled={(!loading)}>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading} />
                                    Start Poll</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* End Poll Modal */}
            <div className="modal fade" id="endPollModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="endPollLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={endPoll}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="endPollLabel">End Poll</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="endEncryptionKeyInput" className="form-label">Decryption Key</label>
                                    <input type="number" className="form-control" id="endEncryptionKeyInput" placeholder="123456"
                                        value={endEncKey}
                                        onChange={event => setEndEncKey(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <span className="text-danger" hidden={!errorMessage}>{errorMessage}</span>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" disabled={(!loading)}>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading} />
                                    End Poll</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* View Result Modal */}
            <div className="modal fade" id="viewResultModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="viewResultLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={viewResult}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="viewResultLabel">View Result</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="totalVoterInput" className="form-label">Total Voter</label>
                                    <input type="number" className="form-control" id="totalVoterInput"
                                        value={totalVoter}
                                        required
                                        readOnly
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="viewResultInput" className="form-label">Total Vote Casted</label>
                                    <input type="number" className="form-control" id="viewResultInput"
                                        value={totalVote}
                                        required
                                        readOnly
                                    />
                                </div>
                                <span className="form-label">Percentage</span>
                                <div className="progress">
                                    <div className="progress-bar" role="progressbar" style={{"width": `${percentage}%`}} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">{percentage}%</div>
                                </div>
                            </div>
                            <span className="text-danger" hidden={!errorMessage}>{errorMessage}</span>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" disabled={(!loading)}>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading} />
                                    View Result</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* Vote Modal */}
            <div className="modal fade" id="voteModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="voteLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={castVote}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="voteLabel">Cast Vote</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="endEncryptionKeyInput" className="form-label">Do you want to vote on this proposal?</label>
                                </div>
                            </div>
                            <span className="text-danger" hidden={!errorMessage}>{errorMessage}</span>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">No</button>
                                <button type="submit" className="btn btn-primary" disabled={(!loading)}>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading} />
                                    Yes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* Voter Modal */}
            <div className="modal fade" id="voterModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="voterLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={addVoter}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="voterLabel">Add Voter</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <span htmlFor="voterLabelInput" className="form-label">All your member who joined your DAO on platform will be added to vote on this proposal.</span>
                                    <span>Do you want to add voter on this proposal ?</span>
                                </div>
                            </div>
                            <span className="text-danger" hidden={!errorMessage}>{errorMessage}</span>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">No</button>
                                <button type="submit" className="btn btn-primary" disabled={(!loading)}>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading} />
                                    Yes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewProposal
