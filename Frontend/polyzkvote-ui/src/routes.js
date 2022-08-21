import React from 'react';
import {BrowserRouter as Router,Switch,Route,Routes} from 'react-router-dom';
import Home from './component/Home';
import DAO from './component/DAO'
import Proposal from './component/Proposal'
import CreateProposal from './component/CreateProposal'




function Routing(){
    return(
        <Router>
            <Routes>
                <Route path='/' element={<Home/>}>
                </Route>
                <Route path='/dao' element={<DAO/>}>
                </Route>
                <Route path='/proposal/:type/:groupId/' element={<Proposal/>}>
                </Route> 
                <Route path='/createproposal/:groupId/' element={<CreateProposal/>}>
                </Route> 
            </Routes>
        </Router>
    )
}

export default Routing