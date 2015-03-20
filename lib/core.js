//Create everything under 'editathon' to avoid conflicts with other libraries
if(typeof editathon=="undefined") {window.editathon={};}

editathon.Editathon=function() {
	
	this._users=[];
	
	this.addUser=function(username) {
		this._users.push(username);
	}
	
	/** Returns true on success and false in any other case **/
	this.removeUser=function(username) {
		for(var i=0;i<this._users.length;i++) {
			if(username==this._users[i]) {
				this._users=this._users.slice(i,i+1);
				return true;
			}
		}
		return false;
	}
	
	this.getUsers=function() {
		return this._users;
	}
	
}
