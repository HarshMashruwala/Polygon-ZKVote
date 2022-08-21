import React, { useEffect, useState } from 'react'
import {Link, Router} from 'react-router-dom';

function JoinDAOCard(props) {
    const [proposalURL,setProposalURL] = useState('')
    useEffect(()=>{
        setProposalURL('/proposal/0/'+props.DAOIdentity)
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

                <p className="card-text">{props.desc}</p>
                <Link className="btn btn-primary" aria-current="page" to={proposalURL}>View Proposal</Link>
                {/* <a href="#" className="btn btn-primary">View Proposal</a> */}

            </div>
        </div>
    )
}

export default JoinDAOCard