import firebase from 'firebase/app';
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

var config = {
    apiKey: "AIzaSyDZ9xzW_q8ie3Qlbc4MN18dkYO5nB30cZI",
    authDomain: "react-slack-clone-574b8.firebaseapp.com",
    databaseURL: "https://react-slack-clone-574b8.firebaseio.com",
    projectId: "react-slack-clone-574b8",
    storageBucket: "react-slack-clone-574b8.appspot.com",
    messagingSenderId: "427303763872"
  };
  firebase.initializeApp(config);

  export default firebase;
