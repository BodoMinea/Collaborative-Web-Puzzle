/*
Monok 2017

For non-https runs of this in linux:
google-chrome --user-data-dir=/tmp --unsafely-treat-insecure-origin-as-secure="http://63.142.255.120" http://63.142.255.120

chromium-browser --user-data-dir=/tmp --unsafely-treat-insecure-origin-as-secure="http://63.142.255.120" http://63.142.255.120

in Windows:
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-data-dir=C:\ChromeTempFiles --unsafely-treat-insecure-origin-as-secure=http://63.142.255.120  https://harvarddecisionlab.org/comprehension-for-credit-instructions

*/


import React from 'react';
import {Carousel,FormControl, MenuItem, DropdownButton, Glyphicon, Well, Panel, Jumbotron, Button } from 'react-bootstrap';
import Collapse from 'react-collapse';
import Board from './puzzle.jsx'
import io from 'socket.io-client'
// import TimeAgo from 'react-timeago'
import NumericInput from 'react-numeric-input';
import ReactCountdownClock from 'react-countdown-clock';

import Admin from './admin.jsx';

var config = require('../../settings/config.json');
var moment = require('moment');

let socket = io(config.server[(location.host ==='localhost' ? 'dev' : config.server.host)].apiUrl)

let p = console.log

class PapayaApp extends React.Component {

	constructor(props){
    super(props);
    this.precondition_step = this.precondition_step.bind(this);
    this.final_screen = this.final_screen.bind(this);
    this.onInitialQuestionAnswer = this.onInitialQuestionAnswer.bind(this);
    this.onGenderInput = this.onGenderInput.bind(this);
    this.onHandleAvatar = this.onHandleAvatar.bind(this);
    this.move = this.move.bind(this);
    this.setTurn = this.setTurn.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.nextGame = this.nextGame.bind(this);
    this.sendDemography = this.sendDemography.bind(this);
    this.answerForRoom = this.answerForRoom.bind(this);
    this.StartTheGame = this.StartTheGame.bind(this);
    this.showInfo = this.showInfo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleVal = this.handleVal.bind(this);
    this.handlePassword = this.handlePassword.bind(this);
    this.handleValAge = this.handleValAge.bind(this);
    this.handlePeerEstimate = this.handlePeerEstimate.bind(this);
    this.gotoSurvey = this.gotoSurvey.bind(this);
    this.mainPage = this.mainPage.bind(this);
    this.nextMainPage = this.nextMainPage.bind(this);
    this.previousMainPage = this.previousMainPage.bind(this);
    this.setVal = this.setVal.bind(this);
    this.setFuzzy = this.setFuzzy.bind(this);
 		this.state = {mainForm:{peer:{loading:1},practice:0},
                  practiceRound:-1,
                  shownStep: 1,
                  gender: null,
                  answer_q1: null,
                  answer_q2: null,
                  answer_q3: null,
                  answer_q4: null,
                  showAvatar: false,
                  boardload:false,
                  estimate: null, 
                  fuzzy: null, 
                  mainFormPage:0,
                  page: 'join', 
                  msg:'', 
                  opponent:'',
                  yourturn:false,
                  board:[], 
                  showInfo:false,
                  time:new Date(),
                  seconds:0,
                  reply:{reply:1,msg:""},
                  replyEstimate:null,
                  password:""};
  }
  
  final_screen(){
    if(this.state.password === 'eir' && this.state.mainForm.name && this.state.mainForm.seat && this.state.gender!=null&&this.state.answer_q1!=null&&this.state.answer_q2!=null&&this.state.answer_q3!=null&&this.state.answer_q4!=null){
      this.precondition_step();
    }else{
      alert('Make sure you have entered your ID, seat and that all of the questions have been answered.');
    }
  }
  
  precondition_step(){
    this.setState({ shownStep: this.state.shownStep+1});
  }
  
  onInitialQuestionAnswer(e){ 
    this.setState(JSON.parse('{ "answer_'+e.currentTarget.name+'":'+parseInt(e.currentTarget.value)+' }'), function() {
      this.onHandleAvatar();
    });
  }
  
  onGenderInput(e){
    this.setState({ gender: e.currentTarget.value }, function() {
      this.onHandleAvatar();
    });
  }
  
  onHandleAvatar(){
    if(this.state.gender!=null&&this.state.answer_q1!=null&&this.state.answer_q2!=null&&this.state.answer_q3!=null&&this.state.answer_q4!=null){
      var avatar_score = (this.state.answer_q1+this.state.answer_q2+this.state.answer_q3+this.state.answer_q4)/2;
      if(avatar_score<=2) this.setState({showAvatar:'/img/'+this.state.gender.toLowerCase()+'_0.png'});
      else this.setState({showAvatar:'/img/'+this.state.gender.toLowerCase()+'_1.png'});  
    }
  }

  componentDidMount() { 
   
    var player = this.props.params.player
    socket.on('err', data => {
      this.setState({ page:"error", msg:data })
    })
    socket.on('replyEstimate', data => {
      if(data.player!==player){
        this.setState({ replyEstimate:data})
        if(this.state.page==='waiting'){
           this.setState({ page:"replyEstimate"})
        }
      }else if(data.player===player){
        this.setState({ msg:data })
      }
    })
    socket.on('gamestart', data => {
      window.location = '/#/'+data.room+'/'+data.player;
      location.reload();
    })  

    socket.on('survey',data=>{
      this.gotoSurvey()
    }) 

    socket.on('practice',data=>{
      let self = this
      console.log("NEW PRACTICE BOARD")
      console.log(data)
      this.setState({page:'practice', board:data.board, yourturn:true, boardload:true, practiceRound:self.state.practiceRound+1})
      self.refreshBoard()
    })

    socket.on('practicedone',data=>{
      //Move on to peer estimate
      this.setState({mainFormPage: 1, page: ''});
    })

    socket.on('peer', data => {
      p(data)
      if(this.state.mainForm.seat.charAt(0)==='A'){
        this.setVal('peer',data.b)
      }else{
        this.setVal('peer',data.a)
      }
     
    })  
    socket.on('gamestart', data => {
      window.location = '/#/'+data.room+'/'+data.player;
      location.reload();
    })
    socket.on('done', data => {
      this.setState({ page:"done", reply:data })
    })

    socket.on('msg', data => {
      p("MESSAGE RECIEVED: "+data)
      this.setState({ page:"msg", msg:data })
    })

    socket.on('next', data => {
      p("MESSAGE RECIEVED: "+data)
      this.setState({ page:"next", msg:data })
    })

    socket.on('userjoined', data => {
    	if(data.player===player){
    		 p("YOU JOINED ROOM " + data.room)
    		this.setState({page:"waiting" })
    	}else{
        this.setState({ opponent:data.player })
				p("User " + data.player + " joined!")
    	}
      // console.log(data)
    })

    socket.on('room', data => {
    	if(data.players.indexOf(player)>-1){
    		p("Your room!")
        var opponent = data.players.filter(name => name!==player).toString()
    		this.setState({time:data.started,page:"board", board:data.board, opponent:opponent,yourturn:data.players[data.turn]===player,seconds:Math.round(moment(data.started).diff(moment())/1000)})
    	}
      // console.log(data)
    })

    socket.on('move', data => {
      // this.setState({yourturn:data.player!==player}) //It's your turn before the animation is done, that's a problem so, even before the board's been updated
      this.refs.pussel.makeAMove(data) //maybe we can activate the board after this is done
    })
  }

  refreshBoard() {
     setTimeout((sdsd)=>{
      this.setState({boardload:false})
     }, 1000) 
  }

	move(position, value, newBoard){
    if(this.state.yourturn && config.blocked.indexOf(value)===-1){
    console.log(value + " at " + position+ " board: "+newBoard)
    if(this.state.page==='practice'){
      socket.emit('pmove', {round:this.state.practiceRound, player:this.state.mainForm.name, move:{position:position, value:value, newBoard:newBoard}})      
    }else{
      socket.emit('move', {room:this.props.params.roomName, player:this.props.params.player, move:{position:position, value:value, newBoard:newBoard}})           
    }
    this.setState({yourturn:false})
    }else if(!this.state.yourturn){
      p("It's not your turn")
    }else if(config.blocked.indexOf(value)>-1){
      p("this particual tile ("+value+") is not allowed to be moved")
    }
  }

  setTurn(data){
    if(this.state.page==='practice'){
      this.setState({yourturn:true})
    }else{
      console.log("Turn switched")
      this.setState({yourturn:data.player!==this.props.params.player })
    }

  }

  joinRoom(){
    socket.emit('joinroom', {room:this.props.params.roomName,player:this.props.params.player})
  }
  nextGame(){
    if(this.state.msg.next!=='gameover'){
      window.location = '/#/'+this.state.msg.next+'/'+this.props.params.player;
      location.reload();
    }

	}
  startGame(){
      window.location = '/#/'+this.state.msg.next+'/'+this.props.params.player;
      location.reload();
  }  
  gotoSurvey(){
      window.location.href = "https://hhs.qualtrics.com/jfe/form/SV_dgRkFEVMs5w8c0R?firstname="+this.props.params.player;
      // location.reload();
  }
  answerForRoom(){
    socket.emit('answer', {room:this.props.params.roomName,player:this.props.params.player, estimate:this.state.estimate, fuzzy:this.state.fuzzy})
    if(this.state.replyEstimate){
      this.setState({ page:"replyEstimate"})
    }else{
      this.setState({page:"waiting" })
    }
  }

  handleChange(valueAsNumber) {
    this.setState({estimate: valueAsNumber});
  } 
  mainPage(page) {
    this.setState({mainFormPage: page});
  }  
  nextMainPage() {
    p('sent profile for save')
    socket.emit('saveProfile', this.state.mainForm)     
    // this.setState({mainFormPage: this.state.mainFormPage+1});
  }
  previousMainPage() {
    this.setState({mainFormPage: this.state.mainFormPage-1});
  }

  setVal(field, val) {
    let newMf = this.state.mainForm
    if(field === 'seat' && config.AisC){
      val = val.replace('C','A')
    }
    newMf[field] = val
    this.setState({mainForm: newMf});
  }
  setFuzzy(val) {
    this.setState({fuzzy: val});
  }
  handleVal(e) {
    let newMf = this.state.mainForm
    newMf.name = e.target.value.toLowerCase().replace(new RegExp(' ', 'g'),'')
    this.setState({mainForm: newMf});
  }  
  handlePassword(e) {
    this.setState({password: e.target.value});
  }
  handleValAge(valueAsNumber) {
    let newMf = this.state.mainForm
    newMf.age = valueAsNumber
    this.setState({mainForm: newMf});
  }
  handlePeerEstimate(valueAsNumber, index) {
    let newMf = this.state.mainForm
    newMf.peer[index] = valueAsNumber
    this.setState({mainForm: newMf});
  }
  myFormat(num) {
    return num + '%';
  }
  showInfo() {
    this.setState({showInfo: true});
  }

  StartTheGame(){
    let mainForm = this.state.mainForm
    if(this.state.password === 'eir' && mainForm.name && mainForm.seat && this.state.gender!=null&&this.state.answer_q1!=null&&this.state.answer_q2!=null&&this.state.answer_q3!=null&&this.state.answer_q4!=null){
      

      if(this.state.mainFormPage===1){
        p('starting game')
        //Send peerestimate and start game
        socket.emit('peerestimate', this.state.mainForm)
      }
      if(this.state.mainFormPage===0){
        var canvas = document.createElement("canvas");
        canvas.width = document.getElementById('myAvatar').naturalWidth;
        canvas.height = document.getElementById('myAvatar').naturalHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(document.getElementById('myAvatar'), 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        this.state.mainForm.image = dataURL;
        socket.emit('saveProfile', this.state.mainForm)
      }
    }else{
      alert('Make sure you have entered your ID, seat and that all of the questions have been answered.');
    }
  }

  sendDemography(){
    console.log("SENDING DEMO")
    // console.log(this.state.mainForm)
    let mainForm = this.state.mainForm
    mainForm.name=this.props.params.player
    if(mainForm.field && mainForm.world  && mainForm.age && mainForm.ethnicity && mainForm.gender && mainForm.education){
      socket.emit('demography', mainForm)
    }
  }

  demographics(){
    let mf = this.state.mainForm
    let world = ["Africa","Asia","Australia","Europe","North America","South America"]
    let gender = ["Female","Male"]
    let ethnicity = ["White / Caucasian (non-Hispanic)","African American (non-Hispanic)","Native American, Aleut or Aboriginal Peoples", "Asian / Pacific Islander", "Latino or Hispanic", "Mixed Race", "Other"]
    let education = ["High-school degree","Bachelor Degree","Master’s Degree","Other"]
    let field = ['Economics','Political Science','Mathematics','Psychology','Humanities','Other Social Sciences','Other Natural Sciences','Other']
    var self = this
    return (
      <div>
        <p>The Experiment is now over, please answer these questions and proceed to the survey. thank you.</p>
        <br/><br/>
         What is your age?<br/>
        <NumericInput onChange={self.handleValAge} min={18} max={100} value={mf.age}/>
        <br/><br/>
        In which part of the world did you grow up?<br/>
        <DropdownButton id="world" title={mf.world}>
          {world.map((world,i)=> <MenuItem onClick={function(){self.setVal('world',world)}} key={"world"+i} eventKey="1">{world}</MenuItem>)}
        </DropdownButton>
        <br/><br/>
        What is your gender?<br/>
        <DropdownButton id="gender" title={mf.gender}>
          {gender.map((gender,i)=> <MenuItem onClick={function(){self.setVal('gender',gender)}} key={"gender"+i} eventKey="1">{gender}</MenuItem>)}
        </DropdownButton>
        <br/><br/>
        What is your ethnicity?<br/>
        <DropdownButton id="ethnicity" title={mf.ethnicity}>
          {ethnicity.map((ethnicity,i)=> <MenuItem onClick={function(){self.setVal('ethnicity',ethnicity)}} key={"ethnicity"+i} eventKey="1">{ethnicity}</MenuItem>)}
        </DropdownButton>
        <br/><br/>
        What is the highest level of education you have completed?<br/>
        <DropdownButton id="education" title={mf.education}>
          {education.map((education,i)=> <MenuItem onClick={function(){self.setVal('education',education)}} key={"education"+i} eventKey="1">{education}</MenuItem>)}
        </DropdownButton>
        <br/><br/>
        What is you field of study?<br/>
        <DropdownButton id="field" title={mf.field}>
          {field.map((field,i)=> <MenuItem onClick={function(){self.setVal('field',field)}} key={"field"+i} eventKey="1">{field}</MenuItem>)}
        </DropdownButton>
        <br/><br/>
        <Button bsStyle="primary" onClick={self.sendDemography}>Proceed to Survey</Button>
      </div>
      )
  }

  roomTranslation(seat){
    // return seat
    if(seat && config.AisC){
      return seat.replace('A','C')
    }else{
      return seat
    }
    
  }

  mainForm(){
    let seatNumbers=config.seatAmount
    let mf = this.state.mainForm
    let seats = []

    let rooms = config.AisC ? ['B', 'C'] : ['A','B']
 
    for(let j = 0; j<rooms.length;j++){
      for(let i = 0; i<seatNumbers; i++){
        seats.push(rooms[j]+(i+1))
      }
    }
    var self = this
    return (      
      <Panel style={{ width: "550px", margin:"100px auto"}}  header={"Sliding Puzzle"} bsStyle="primary">
      
      <div style={this.state.shownStep === 1 ? {} : { display: 'none' }}>
        <p>You are being asked to provide consent to participate in this research study. Participation is voluntary. You can say yes or no. If you say yes now you can still change your mind later.</p>
        <p>This research is being done to better understand beliefs and behaviors in group work among university students. You are being asked to participate because you are a student at NYU Abu Dhabi.</p>
        <p>You will be asked to complete a survey about your wellbeing and play a puzzle on your own and together with a teammate.&nbsp; You will also be asked questions your individual and your teammate&rsquo;s contribution to the solving of the puzzle. Your specific responses may be anonymously shared with the other participants throughout the game, but never in a way in which you could be identified as the respondent.</p>
        <p>Participation in both the survey and game will involve maximum 120 minutes of your time.</p>
        <p>We believe the risks for participation in this study are minimal. Some of the questions ask you to reflect on your wellbeing which may cause you to feel upset. Please note that none of the questions asked are leading to a diagnostic and that none of the researchers involved with this study are medical professionals. Please keep in mind that you can reach out to the NYU Wellness Exchange that operates (24/7) by calling +971 2-628-5555. A complete list of resources has been shared with you together with this form. You can also stop the game at any time.</p>
        <p>Your participation in this research is voluntary and will have no effect on your academic standing.</p>
        <p>You will not benefit directly from participating in this study. We hope to learn more about group work among university students, and your participation will help us to do that. In exchange to your participation, you will be financially compensated with a small subsistence allowance. The payment from solving the game will work the following way: each puzzle has an equal probability to be randomly picked as the puzzle based for payment. If the puzzle that was randomly selected was solved by a certain pair, each participant from the pair will earn 10AED extra. Each solved puzzle in the individual round will generate an additional 1AED, so if you managed to solve 5 practice puzzles in 4 minutes, you will earn 4AED and so forth. Finally, one contribution question will be randomly selected, and if you provided an answer close enough to the actual contributions on these questions, you will earn an additional 5AED per question. On top of this, everyone will be guaranteed a show up fee of 50AED. Additionally, the top performing participant across all game sessions will receive a prize worth 700AED. You will be receiving the payment in the form of a voucher via the email shared previously.</p>
        <p><em>&nbsp;</em></p>
        <p>All of your responses will be held in confidence and in a secure location. All electronic files (e.g., database, spreadsheet, etc.) containing identifiable information will be password protected.&nbsp; Any computer hosting such files will also have password protection to prevent access by unauthorized users. &nbsp; Only the researchers involved in this study will have access to the information you provide. None of that information will be shared with Student Affairs or other university entities. Study results will report findings as averages across all businesses and never name you directly. Information, not containing personal identifiers, may be used in future research or shared with other researchers.</p>
        <p>If you have further questions about this study or if you have a research-related problem, you may contact the principal investigator prof. Morgan Hardy at morgan.hardy@nyu.edu or the student researcher Ana Radu at amrr1190@nyu.edu or +971501475701.</p>
        <p>If you have any questions concerning your rights as a research participant, you may contact the New York University Abu Dhabi Institutional Review Board (IRB) at irbnyuad@nyu.edu.</p>
        <p style={{'textAlign':'center'}}>Do you consent to be part of this study?</p>
        <p style={{'textAlign':'center'}}><Button bsStyle="success" onClick={this.precondition_step}>Yes</Button></p>
      </div>
      
      <div style={this.state.shownStep === 2 ? {} : { display: 'none' }}>
        <p>Thank you for you consent. Today you will be solving sliding puzzles. On the screen you will see a square with 9 smaller pieces inside - 8 of them numbered from 1- 8 and one empty square. Your task is to bring the numbers into the final position seen below:</p>
        
        <p style={{'textAlign':'center'}}><img width="30%" src={"img/example.png"}/></p>
        
        
        
        <p>You are manuvering the numbers inside the square by clicking on the number you would like to move into the empty spot. Please try your best to solve every puzzle. The time limit for each round is 4minues or until the puzzle is solved.</p>
        
        <p>In round 0 (practice round) you will be solving as many puzzles as you can alone with the computer. </p>
        
        <p>After the pracice round you will be randomly assigned a teammate. You and your teammate will alternatively make moves in order to solve the puzzle. You aren't able to communicate with your teammate. Please try your best to collaborate with your teammate and solve each puzzle.</p>
        
        <p>The game will end once you have played with every other participant. 
          </p>

        <p style={{'textAlign':'center'}}><Button bsStyle="success" onClick={this.precondition_step}>Continue</Button></p>
      </div>
    
      <div style={this.state.shownStep === 3 ? {} : { display: 'none' }}>
      What is your unique ID:<br/>
      <FormControl
        type="text"
        value={mf.name}
        placeholder="Type in the ID that was given to you as part of the enrollment"
        onChange={this.handleVal}
        autoComplete="false"
      />
      <br/>
      What is your gender:
      <div>
        <input type="radio" value="Male" name="gender" onChange={this.onGenderInput} /> Male &nbsp;
        <input type="radio" value="Female" name="gender" onChange={this.onGenderInput} /> Female
      </div>
      <br />
      Over the last 2 weeks, how often have you been bothered by any of the following problems?
      <ul>
        <li>
          Little interest or pleasure in doing things
          <div>
            <input type="radio" value="0" name="q1" onChange={this.onInitialQuestionAnswer} /> Not at all &nbsp;
            <input type="radio" value="1" name="q1" onChange={this.onInitialQuestionAnswer} /> Several days &nbsp;
            <input type="radio" value="2" name="q1" onChange={this.onInitialQuestionAnswer} /> More than half of days &nbsp;
            <input type="radio" value="3" name="q1" onChange={this.onInitialQuestionAnswer} /> Nearly every day
          </div>
        </li>
        <li>
          Feeling down, depressed, or hopeless
          <div>
            <input type="radio" value="0" name="q2" onChange={this.onInitialQuestionAnswer} /> Not at all &nbsp;
            <input type="radio" value="1" name="q2" onChange={this.onInitialQuestionAnswer} /> Several days &nbsp;
            <input type="radio" value="2" name="q2" onChange={this.onInitialQuestionAnswer} /> More than half of days &nbsp;
            <input type="radio" value="3" name="q2" onChange={this.onInitialQuestionAnswer} /> Nearly every day
          </div>
        </li>
      </ul>
      <br />
      Over the last 2 weeks, how often have you been bothered by the following problems?
      <ul>
        <li>
          Feeling nervous, anxious or on edge
          <div>
            <input type="radio" value="0" name="q3" onChange={this.onInitialQuestionAnswer} /> Not at all &nbsp;
            <input type="radio" value="1" name="q3" onChange={this.onInitialQuestionAnswer} /> Several days &nbsp;
            <input type="radio" value="2" name="q3" onChange={this.onInitialQuestionAnswer} /> More than half of days &nbsp;
            <input type="radio" value="3" name="q3" onChange={this.onInitialQuestionAnswer} /> Nearly every day
          </div>
        </li>
        <li>
          Not being able to stop or control worrying
          <div>
            <input type="radio" value="0" name="q4" onChange={this.onInitialQuestionAnswer} /> Not at all &nbsp;
            <input type="radio" value="1" name="q4" onChange={this.onInitialQuestionAnswer} /> Several days &nbsp;
            <input type="radio" value="2" name="q4" onChange={this.onInitialQuestionAnswer} /> More than half of days &nbsp;
            <input type="radio" value="3" name="q4" onChange={this.onInitialQuestionAnswer} /> Nearly every day
          </div>
        </li>
      </ul>
      
      <br/>
      Your seat number<br/>
      <DropdownButton bsSize="large" id="seat" title={self.roomTranslation(mf.seat)}>
        {seats.map((seat,i)=> <MenuItem  onClick={function(){self.setVal('seat',seat)}} key={"seat"+i} eventKey="1">{seat}</MenuItem>)}
      </DropdownButton>
      <br/><br/>
         
        <br/>
        <br/>
      Researcher Signature (please wait for the researcher to sign you in)
      <br/>
       <FormControl
        type="password"
        autoComplete="off"
        value={this.state.password}
        placeholder="Researcher Signature"
        onChange={this.handlePassword}
      />
      <br/>
        <p style={{'textAlign':'center'}}><Button bsStyle="success" onClick={this.final_screen}>Continue</Button></p>
      </div>
      
      <div style={this.state.shownStep === 4 ? {} : { display: 'none' }}>
        <div style={{ display: this.state.showAvatar===false ? "none" : "unset"}}>
          Based on your previous responses you have been assigned the avatar below: <br />
          <center><img id="myAvatar" src={this.state.showAvatar} style={{ width: '50%' }} /></center><br/>
          Here are all the possible avatars available in this game:
          <center>
            <img id="myAvatar" src="img/female_0.png" style={{ width: '24%' }} />
            <img id="myAvatar" src="img/female_1.png" style={{ width: '24%' }} />
            <img id="myAvatar" src="img/male_0.png" style={{ width: '24%' }} />
            <img id="myAvatar" src="img/male_1.png" style={{ width: '24%' }} />
          </center>
        </div><br/>
        <p style={{'textAlign':'center'}}><Button bsStyle="primary" onClick={this.StartTheGame}>Start Practice Round</Button></p>
      </div>
      </Panel>
      
      )
  }

  getReplyForm(){
    return (
      <Panel style={{ width: "550px", margin:"100px auto"}}  header={"Sliding Puzzle result for "+ this.props.params.player} bsStyle="primary">
      {this.replyForm()}
      </Panel>
      )
  }

  compileMessage(message, opponent, roomName){
    message = message.replace(new RegExp('\\[partner\\]', 'g'),opponent.toUpperCase())
    message = message.replace(new RegExp('\\[puzzle\\]', 'g'),roomName.toUpperCase())
    return message
  }

  replyForm(){
    let self = this
    let fuzzyAnswer = config.fuzzy
    var m = this.props.params.reply
    m = m ? m : this.state.reply.reply
    m = m ? m : 1
    var message = config["solveMessage"+m]
    var info =  this.compileMessage(config["info"+(m>2 ? 2:1)],this.state.opponent,this.props.params.roomName)
    message = this.compileMessage(message,this.state.opponent,this.props.params.roomName)

     return (<Jumbotron>
        <p>{message}</p>
        {this.state.showInfo ? <p style={{fontSize: 'initial'}}>{info}</p> : <Button  onClick={this.showInfo} bsStyle="default" style={{marginBottom:'30px'}}>Show more info</Button>}
        <br/>
        <p>Your contribution:</p><p style={{color:'grey',fontSize: 'small'}}> (Not visible to your partner)</p>
        <NumericInput placeholder="Your contribution" onChange={this.handleChange} style={{wrap: {fontSize: 32}}} min={0} max={100} value={this.state.estimate}  format={this.myFormat}/>
        <br/>
        <br/>
        <p>Do you think you would be better on your own?</p>
        <DropdownButton id="fuzzyAnswer" title={this.state.fuzzy}>
          {fuzzyAnswer.map((fuzzyAnswer,i)=> <MenuItem onClick={function(){self.setFuzzy(fuzzyAnswer)}} key={"fuzzyAnswer"+i} eventKey="1">{fuzzyAnswer}</MenuItem>)}
        </DropdownButton>
        <p>{this.state.estimate!==null && this.state.fuzzy ? <Button  onClick={this.answerForRoom} bsStyle="primary" style={{marginTop:'30px'}}>Answer for game: <b>{this.props.params.roomName.toUpperCase()}</b></Button> : null}</p>
      </Jumbotron>)
  }

  thePeopleForm(){
    var self = this

    let allFilled = true
    Object.keys(self.state.mainForm.peer).forEach((p)=>{
      if(self.state.mainForm.peer[p]===null){
        allFilled=false
      }
    })

    let toRender =  Object.keys(self.state.mainForm.peer).map((peer)=>
    <div key={peer+"-person"}>
      <br/><br/>
      <img style={{borderRadius:'50%', display:'block',margin:'auto'}} width={300} height={300} src={"img/people/" + peer +".png"} className="avatar"/>
      <br/><p style={{textAlign: 'center',fontWeight: 'bold',fontSize: 'large'}}>{peer} - Estimate average contribution</p>
      <NumericInput onChange={function(val){self.handlePeerEstimate(val, peer)}} value={self.state.mainForm.peer[peer]}  style={{wrap: {fontSize: 32,textAlign:'center', width: '100%'}}} min={0} max={100}  format={this.myFormat} />
      <br/>
    </div>)

    return (<Panel style={{ width: "550px", margin:"100px auto"}}  header={"Sliding Puzzle"} bsStyle="primary">
            <p>{config.peerMessage}</p>
            {self.state.mainForm.peer.loading ? <div>
              <b>Please wait for all participants to register..</b>
              <img style={{display: 'block', marginLeft: 'auto', marginRight: 'auto'}} src="/img/loading.gif"/></div> : toRender}
            {self.state.mainForm.peer.loading || !allFilled ? null : 
              <Button  onClick={this.StartTheGame} bsStyle="primary" style={{marginTop:'30px'}}>Start The Game</Button> }
            </Panel>)

  }


  enterGame(){
    return (<Jumbotron>
              <h1>Hello, {this.props.params.player}!</h1>
              <p>{config.enterGameMessage}</p>
              <p><Button bsStyle="primary" onClick={this.joinRoom}>JOIN ROOM: <b>{this.props.params.roomName.toUpperCase()}</b></Button></p>
            </Jumbotron>)
  }

  headerContent(){
    let replyState = (this.props.params.reply && this.state.page!="msg") || this.state.page==="done"
    let gameOver = this.state.msg.next==='gameover'
    let self = this
    return (
        <h3>
          {this.state.page==="error" ? "Error!": null}
          {this.state.page==="replyEstimate" ? "Your partners reply": null}
          {this.state.page==="join" ? "Welcome to Puzzle Experiment!": null}
          {this.state.page==="waiting" ? "Please wait for participant, game (" + this.props.params.roomName.toUpperCase()+")": null}
          {this.state.opponent!=="" && !gameOver ? (
            <div style={{height:130}}>Playing together with&nbsp; 
            <b>{this.state.opponent}</b>{this.state.yourturn ? (<b> - Your turn!</b>): (<b> - Waiting...</b>)}
            <img style={{opacity:(this.state.yourturn? 0.4: 1), borderRadius:'50%', display: 'block', float: 'left', marginTop:10,borderWidth: 3, borderColor: 'white', borderStyle: 'solid'}} width={100} height={100} src={"img/people/" + this.state.opponent +".png"} className="avatar"/>
              {!replyState && !gameOver ? <div style={{float:'right',marginTop:10}}>
                <ReactCountdownClock seconds={240+self.state.seconds}
                       color="#FFFFFF"
                       alpha={0.9}
                       size={100}
                       timeFormat="hms"
                       onComplete={(lol)=>{}} />
              </div> : null}
            </div>
            ) : null}
          {this.state.page=='practice' ? <div>
            <b>Practice Round! - You earn 25 cents per Board, Solve as many as you can!</b>
            <ReactCountdownClock seconds={240}
                       color="#FFFFFF"
                       alpha={0.9}
                       size={100}
                       timeFormat="hms"
                       onComplete={(lol)=>{
                        this.setState({mainFormPage: 1, page: ''});
                       }} />
          </div> : null}
        </h3>
      );
  }


  render() {
    console.log(this.props.params)
    if(this.props.params.roomName==='admini' && this.props.params.player==='stration'){
      return (<Admin>HELLO WORLD</Admin>)
    }

    var self = this
    //myturn={this.state.yourturn}
    if(this.state.page==='practice'){
      return (<Panel style={{ width: "350px", margin:"100px auto"}}  header={self.headerContent()} bsStyle="primary">
                {this.state.boardload ? <div><img style={{display: 'block', marginLeft: 'auto', marginRight: 'auto'}}src="/img/loading.gif"/></div> :
                <Board board={this.state.board} setTurn={this.setTurn}  move={self.move} style={{textAlign:"center"}} ref="pussel" /> }      
              </Panel>)
    }


    if(!this.props.params.player && !this.props.params.roomName){
      if(this.state.mainFormPage===0){
        return this.mainForm()
      }else if(this.state.mainFormPage===1){
        return  this.thePeopleForm()
      }
    }

    if((this.props.params.reply && this.state.page!="msg") || this.state.page==="done"){
      return this.getReplyForm()
    }else{

      return (
        <Panel style={{ width: "350px", margin:"100px auto"}}  header={this.headerContent()} bsStyle="primary">
          <div> 

          <Collapse style={{width:"100%"}} isOpened={this.state.page==="board"}>
            <Board  board={this.state.board} setTurn={this.setTurn} move={this.move} style={{textAlign:"center"}} ref="pussel" />       
          </Collapse>
          {this.state.page==="join" ? this.enterGame() : null}
          {this.state.page==="waiting" ? (<div><img style={{display: 'block', marginLeft: 'auto', marginRight: 'auto'}} src="/img/loading.gif"/></div>): null}
          {this.state.page==="error" ? (<div><Glyphicon glyph="exclamation-sign" /> {this.state.msg}</div>) : null}
          {this.state.page==="msg" ? (<h1>{this.state.msg}</h1>) : null}
          {this.state.page==="next" ? (<div>
                                          <h1>{this.state.msg.msg}</h1>
                                          {this.state.msg.next!=='gameover' ? 
                                          <Button bsStyle="primary" onClick={this.nextGame}>Continue to the next game</Button> : this.demographics()}      
                                      </div>) : null}
          {this.state.page==="replyEstimate" ? (<div>
                                                  <h1>{this.state.opponent} estimated {this.state.replyEstimate.estimate}% as their contribution to this game ({this.props.params.roomName})</h1>
                                                  {this.state.msg.next!=='gameover' ? 
                                                  <Button bsStyle="primary" onClick={this.nextGame}>Continue to the next game</Button> : this.demographics()} 
                                                </div>) : null}
          </div>
        </Panel>
      ) 
    }
		
  }
}
 // <Well bsSize="small">This game started <TimeAgo date={this.state.time}/></Well>
export default PapayaApp;