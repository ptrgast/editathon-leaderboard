//Create everything under 'eldb' to avoid conflicts with other libraries
if(typeof eldb=="undefined") {window.eldb={};}


////////// Editathon //////////
eldb.Editathon=function(log) {
	
	this._STOPPED=0;
	this._STARTED=1;
	
	this._log=log|false;
	this._apiPath="/w/api.php";
	this._languages=[];
	this._users=[];
	this._status=this._STOPPED;
	
	this.setLanguages=function(languages) {
		this._languages=[].concat(languages);
	}
	
	/** Adds a new user to this Editathon **/
	this.addUser=function(username) {
		var index=this._findUser(username);
		if(index<0) { //user not found
			var user=new eldb._User(username);
			this._users.push(user);
			this.log("New user added. (total: "+this._users.length+" users)");
			return true;
		} else { //user already added
			this.log("User already exists in this Editathon.");
			return false;					
		}
	}
	
	/** Returns true on success and false in any other case **/
	this.removeUser=function(username) {
		var index=this._findUser(username);
		if(index>=0) { //user found
			this._users=this._users.slice(0,index).concat(this._users.slice(index+1));
			this.log("User removed. (total: "+this._users.length+" users)");
			return true;
		} else { //user not found
			this.log("The requested username was not found in this Editathon.");
			return false;			
		}
	}
	
	/** Returns the index of a user in the _users array or -1 if the user is not in the array. **/
	this._findUser=function(username) {
		for(var i=0;i<this._users.length;i++) {
			if(username==this._users[i].username) {return i;}
		}
		return -1;
	}
	
	this.getUsers=function() {
		return this._users;
	}
	
	/** Start this Editathon **/
	this.start=function() {
		if(this._status==this._STARTED) {return;}
		this._status=this._STARTED;
		this.log("Editathon started. ("+new Date()+")");
	}

	/** Stop this Editathon **/
	this.stop=function() {
		if(this._status==this._STOPPED) {return;}
		this._status=this._STOPPED;
		this.log("Editathon stopped. ("+new Date()+")");
	}
		
	/** This should be used to output messages to the console. **/
	this.log=function(message) {
		if(this._log) {console.log("[eldb] "+message);}
	}
	
	this.log("Editathon created.");	
}


////////// _User //////////
eldb._User=function(username) {

	this.username=username;

}