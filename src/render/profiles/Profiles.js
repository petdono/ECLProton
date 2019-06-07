import React from 'react';
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import './profiles.css';

class Profiles extends React.Component {
    constructor(props) {
        super(props);

        window.ipc.on('profiles', (event, payload) => {
            this.setState({
                profiles: payload,
            });
        });

        window.ipc.send('profiles', { action: 'LIST' });

        this.state = { profiles: [ ] };
    }

    handleLaunch(profile) {
        window.ipc.send('profile:launch', profile);
    }

    render() {
        if (this.state.profiles.length === 0) {
            return (
                <div className="profiles-empty">
                    <h1><i className="fas fa-exclamation"></i></h1>
                    <p>You do not appear to have any profiles installed!</p>
                    <p>Consider&nbsp;
                        <span onClick={() => document.getElementById('curse').click()}>installing one from curse</span>
                        , or&nbsp;
                        <span onClick={() => document.getElementById('custom').click()}>creating your own</span>.
                    </p>
                </div>
            );
        }
        return (
            <div className="profiles">
                {this.state.profiles.map(profile => {
                    return (<Profile key={profile.name} {...profile} onLaunch={(name) => this.handleLaunch(name)} />)
                })}
            </div>
        );
    }
}

const Profile = (props) => { //todo need to create an icon container for icon centering. Some sort of <Icon /> componenty
    return (
        <div>
            <ContextMenuTrigger id={props.name}>
                <div className="profile">
                    <img src={props.icon} alt={props.name}/>
                    <div className="profile-content" style={{backgroundImage: `url("${props.icon}")`}}>
                        <div className="profile-blur"></div>
                        <div className="profile-details">
                            <h1>{props.name}</h1>
                            {props.played === 0 ? (<p>{props.version.indexOf('-') !== -1 ? props.version.split('-')[1] : props.version}</p>) : (<p>{props.version.indexOf('-') !== -1 ? props.version.split('-')[1] : props.version}<span>•</span>{new Date(props.played).toLocaleDateString()}</p>)}
                        </div>
                        <div className="profile-play" onClick={() => props.onLaunch(props.name)}>
                            <i className="fas fa-play"></i>
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenu id={props.name}>
                <MenuItem onClick={() => props.onLaunch(props.name)}><i className="fas fa-play"></i>Launch</MenuItem>
                <MenuItem onClick={() => alert("// not implemented //")} disabled><i className={`fa${props.favorite ? 'r' : 's' } fa-star`}></i>Favorite</MenuItem>
                <MenuItem onClick={() => alert("Option 2")}><i className="fas fa-cog"></i>Settings</MenuItem>
                <MenuItem onClick={() => alert("Option 2")}><i className="fas fa-folder"></i>Open Folder</MenuItem>
                <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-link"></i>Create Shortcut</MenuItem>
                <MenuItem onClick={() => alert("// not implemented //")} disabled><i className="fas fa-file-export"></i>Export</MenuItem>
                <MenuItem divider />
                <MenuItem onClick={() => alert("// not implemented //")}><i className="fas fa-trash-alt"></i>Delete</MenuItem>
            </ContextMenu>
        </div>
    );
};

export {
    Profiles,
    Profile
}
