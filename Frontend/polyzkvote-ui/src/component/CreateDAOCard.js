import React,{useEffect,useState} from 'react'
import {Link, Router} from 'react-router-dom';

function CreateDAOCard(props) {
    const [proposalCreateURL,setProposalCreateURL] = useState('')
    const [proposalURL,setProposalURL] = useState('')
    useEffect(()=>{
        setProposalCreateURL('/createproposal/'+props.DAOIdentity)
        setProposalURL('/proposal/1/'+props.DAOIdentity)
    },[])
    return (
        <div className="card shadow border-info m-2">
            <div className="card-header">{props.name}</div>
            <div className="card-body text-secondary">
                <div className='row'>
                    <div className='col-3'>
                        <h6 className="card-title">DAO Identity</h6>
                    </div>
                    <div className='col-9'>
                        <h6 className="card-title">{props.DAOIdentity}</h6>
                    </div>
                </div>
                <div className='row'>
                    <div className='col-3'>
                        <h6 className="card-title">Discord Server Id</h6>
                    </div>
                    <div className='col-9'>
                        <h6 className="card-title">{props.channelId}</h6>
                    </div>
                </div>
                <div className='row'>
                    <div className='col-3'>
                        <h6 className="card-title">Discord Server Role</h6>
                    </div>
                    <div className='col-9'>
                        <h6 className="card-title">{props.role}</h6>
                    </div>
                </div>
                <p className="text-danger">Note:Please share your DAO Identity for Joining DAO. Discord server id is not valid for Joining DAO.</p>
                <p className="card-text">{props.desc}</p>
                <Link className="btn btn-primary m-2 p-2" aria-current="page" to={proposalURL}>View Proposal</Link>
                <Link className="btn btn-secondary m-2 p-2" aria-current="page" to={proposalCreateURL}>Create Proposal</Link>
            </div>
        </div>
    )
}

export default CreateDAOCard