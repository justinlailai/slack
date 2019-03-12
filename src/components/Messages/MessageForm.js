import React, { Component } from 'react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import {Segment, Button, Input} from 'semantic-ui-react';
import FileModal from './FileModal';
import ProgressBar from './ProgressBar';

class MessageForm extends Component{
    state={
        message:'',
        typingRef:firebase.database().ref('typing'),
        channel: this.props.currentChannel,
        user:this.props.currentUser,
        loading:false,
        errors:[],
        modal:false,
        uploadState:'',
        percentUploaded:0,
        uploadTask:null,
        storageRef:firebase.storage().ref()
    };

    openModal=()=>this.setState({modal:true});
    closeModal=()=>this.setState({modal:false});

    handleChange = event=>{
        this.setState({[event.target.name]:event.target.value});
    }
    createMessage=(fileUrl=null)=>{
        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            content:this.state.message,
            user:{
                id:this.state.user.uid,
                name:this.state.user.displayName,
                avatar: this.state.user.photoURL
            },
        };
        if(fileUrl !==null){
            message['image'] = fileUrl;
        }else{
            message['content'] = this.state.message;
        }
        return message;
    }
    _handleKeyPress=(event)=>{
        if (event.key === 'Enter'){
            this.sendMessage();
        }
        return;
    }

    sendMessage=()=>{
        const {getMessagesRef} = this.props;
        const {message,channel,user,typingRef} =  this.state;
        if(message){
            this.setState({loading:true});
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(()=>{
                    this.setState({loading:false,message:"",errors:[]});
                    typingRef
                        .child(channel.id)
                        .child(user.uid)
                        .remove();
                })
                .catch((err)=>{
                    console.error(err);
                    this.setState({
                        loading:false,
                        errors:this.state.errors.concat(err)
                    })
                })
        }else{
            this.setState({
                errors:this.state.errors.concat({message:'Add a message'})
            })
        }
    }
    getPath=()=>{
        if(this.props.isPrivateChannel){
            return `chat/private-${this.state.channel.id}`;
        } else{
            return `chat/public`
        }
    }

    uploadFile = (file,metadata) =>{
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessagesRef();
        const filePath = `${this.getPath()}/public/${uuidv4()}.jpg`;
        this.setState({
            uploadState:'uploading',
            uploadTask:this.state.storageRef.child(filePath).put(file,metadata)
        },
        ()=>{
            this.state.uploadTask.on('state_changed',snap=>{
                const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes)*100);
                this.props.isProgressBarVisible(percentUploaded);
                this.setState({percentUploaded});
            },
            err=>{
                console.error(err);
                this.setState({
                    errors:this.state.errors.concat(err),
                    uploadState:'error',
                    uploadTask:null
                })
            },
            ()=>{
                this.state.uploadTask.snapshot.ref.getDownloadURL().then(downloadUrl=>{
                    this.sendFileMessage(downloadUrl,ref,pathToUpload);
                })
                .catch(err=>{
                    console.error(err);
                    this.setState({
                        errors:this.state.errors.concat(err),
                        uploadState:'error',
                        uploadTask:null
                    })
                })
            }
            )
        }
        )
    };

    handleKeyDown=()=>{
        const {message,typingRef,channel,user} = this.state;
        if(message){
            typingRef
                .child(channel.id)
                .child(user.uid)
                .set(user.displayName);
        }else{
            typingRef
            .child(channel.id)
            .child(user.uid)
            .remove();
        }
    }

    sendFileMessage = (fileUrl,ref,pathToUpload)=>{
        ref.child(pathToUpload)
        .push()
        .set(this.createMessage(fileUrl))
        .then(()=>{
            this.setState({uploadState:'done'})
        })
        .catch(err=>{
            console.log(err);
            this.setState({
                errors:this.state.errors.concat(err)
            })
        })
    }

   render(){
       const {errors,loading,message,modal,uploadState, percentUploaded} = this.state;
       return(
            <Segment className="message__form">
                <Input
                    fluid
                    name="message"
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    onKeyPress={this._handleKeyPress}
                    value={message}
                    style={{marginBottom:'0.7em'}}
                    label={<Button icon={'add'}/>}
                    labelPosition="left"
                    className={
                        errors.some(error=>error.message.includes('message'))?'error':''
                    }
                    placeholder="Write your message"
                />
                <Button.Group icon widths="2">
                    <Button
                        color="orange"
                        disabled={loading}
                        content="Add Reply"
                        labelPosition="left"
                        icon="edit"
                        onClick={this.sendMessage}
                    />
                    <Button
                        color="teal"
                        disabled={uploadState === "uploading"}
                        content="Upload Media"
                        labelPosition="right"
                        icon="cloud upload"
                        onClick={this.openModal}
                    />
                </Button.Group>
                    <FileModal 
                        modal={modal}
                        closeModal={this.closeModal}
                        uploadFile={this.uploadFile}
                    />
                    <ProgressBar
                        uploadState={uploadState}
                        percentUploaded={percentUploaded}
                    />
            </Segment>
       )
   } 
}

export default MessageForm;