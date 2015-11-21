
<script type="text/javascript">
	//declare and init variables
	var canvas;
	var context;
	var HEIGHT = 600;
	var WIDTH = 800;
	var middleY = HEIGHT / 2;
	var middleX = WIDTH / 2;
	var CARD_SIZE = [72, 96];
	var CARD_CENTER = [36, 48];
	
	//Get images
	var cardBack = new Image();
	cardBack.src = "http://storage.googleapis.com/codeskulptor-assets/card_jfitz_back.png";
	var cardFront = new Image();
	cardFront.src = "http://storage.googleapis.com/codeskulptor-assets/cards_jfitz.png";
		
	//Card Constants
	var SUITS = ['C', 'S', 'H', 'D'];
	var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
	
	//Default card value. If the card in rule, follow rule before check actual value.
	var VALUES = {'A':14, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13};

	var READABLE = {'A': 'Ace', '2':'Two', '3':'Three', '4':'Four', '5':'Five', '6':'Six',
					'7':'Seven', '8':'Eight', '9':'Nine', 'T':'Ten', 'J':'Jack', 'Q':'Queen',
					'K':'King', 'C':'Club', 'S':'Spade', 'H':'Heart', 'D':'Diamond'};
	
	var FRONT = true;
	var BACK = false;
		
	var logMessage = '';
	
	//mouse coordinate
	var mX, mY;
	//mouse left or right click, short for mouse button. Value 'r' or 'l'
	var mB;
	
	//Card type
	var PLAY_CARD = 0;	
	var PILE_CARD = 1;
	var HOLD_UP_CARD = 2;
	var HOLD_DOWN_CARD = 3;
	var DECK_TOP_CARD = 4;
	var DECK_BOT_CARD = 5;
	
	//Game state
	var ZERO_STATE = 0;
	var DEAL_STATE = 1;
	var SWAP_STATE = 2;
	var PLAY_STATE = 3;
	var WIN_STATE = 4;
	
	//Special Cards
	var BURN_CARD = 'T';
	var REVERSE_CARD = 5;
	var RESTART_CARD = 2;
	
	//********************************************************************************************	
	//CARD CLASS
	var Card = function(side, x, y, suit, rank){
		this.updatePosition(x, y);
		this.side = side;
		this.suit = suit;
		this.rank = rank;
		this.select = -1;
	}
	
	Card.prototype.updatePosition = function(x, y){
		this.x = x;
		this.y = y;
		this.left = x;
		this.right = x + CARD_SIZE[0];
		this.top = y;
		this.bot = y + CARD_SIZE[1];
	}

	Card.prototype.draw = function(){
		if(this.side == BACK){
			context.drawImage(cardBack, 
							CARD_SIZE[0] * 0, CARD_SIZE[1] * 0, //start cutting position, (horizonal, vertical)
							CARD_SIZE[0], CARD_SIZE[1], //cutting size (width, height)
							this.x, //horizonal position on canvas
							this.y, //vertical position on canvas
							CARD_SIZE[0], CARD_SIZE[1]); //output size (width, height)
		}
		else{
			context.drawImage(cardFront, 
							CARD_SIZE[0] * RANKS.indexOf(this.rank), CARD_SIZE[1] * SUITS.indexOf(this.suit), //start cutting position, (horizonal, vertical)
							CARD_SIZE[0], CARD_SIZE[1], //cutting size (width, height)
							this.x, //horizonal position on canvas
							this.y, //vertical position on canvas
							CARD_SIZE[0], CARD_SIZE[1]); //output size (width, height)
		}
 	}
	
	Card.prototype.toString = function(){
		return this.suit + this.rank;
	}
	//********************************************************************************************
	var CardInfo = function(card, cardType, index, list){
		/*
			Motivation: most of Card important info such as  index or list or even cardType are not available until click.
			Reason is placing cardType into Card object will give add() and remove() methods more work and too specific.
			So most info are found on click which makes implementation clearer.
		*/
		this.card = card;
		this.cardType = cardType;
		this.index = index;//index in list
		this.list = list;//list card belongs to
	}
	//********************************************************************************************		
	//...IN PROGRESS...
	function Hand(xStart, yStart, id, name){

		this.id = id;//turn. It is used to track turn. Simple and dirty way.
		this.name = name;
		
		this.spaceBetweenHoldCards = [CARD_SIZE[0] + 15, 0];
		this.spaceStackHoldCards = [-3, -3];
	
		this.spaceBetweenHandCards = [15, 0];
		
		this.xHold = xStart;
		this.yHold = yStart;
		
		this.xHand = xStart + this.spaceBetweenHoldCards[0] * 3 + 30;
		this.yHand = yStart;
		
		this.listOfHoldCards = []; //store Card
		
		this.listOfHandCards = []; //store Card
		
		this.listOfSelectCards = []; //store CardInfo
	}
	
	Hand.prototype.getTotalLen = function(){
		return this.listOfHandCards.length + this.listOfHoldCards.length;
	}
	
	Hand.prototype.addHoldCard = function(card){
		if(typeof card === 'undefined' || card === null)
			printLog("No card to add!");
		else if(!(card instanceof Card))
			printLog("This is not a card! Cannot add!");
		else{
			card.updatePosition(this.xHold, this.yHold);
			if(this.listOfHoldCards.length < 3){
				card.side = BACK;
				this.listOfHoldCards.push(card);
			}
			else
				this.listOfHoldCards.push(card);
			this.getNextHoldPosition();		
		}		
	}
	
	Hand.prototype.getNextHoldPosition = function(){
		if(this.listOfHoldCards.length != 3){
			this.xHold += this.spaceBetweenHoldCards[0];
			this.yHold += this.spaceBetweenHoldCards[1];
		}
		else{
			this.xHold = this.xHold - this.spaceBetweenHoldCards[0] * 2 + this.spaceStackHoldCards[0];
			this.yHold += this.spaceStackHoldCards[1];
		}
	}
	
	Hand.prototype.addHandCard = function(card){
		if(typeof card === 'undefined' || card === null)
			printLog("No card to add!");
		else if(!(card instanceof Card))
			printLog("This is not a card! Cannot add!");
		else{
			nextPosition = this.getHandPositionAt(this.listOfHandCards.length);
			card.updatePosition(nextPosition.x, nextPosition.y);			
			this.listOfHandCards.push(card);
		}		
	}
		
	Hand.prototype.getHandPositionAt = function(index){
		return {x: this.xHand + this.spaceBetweenHandCards[0] * index,
				y: this.yHand};
	}
	
	Hand.prototype.addCard = function(card){
		if(this.listOfHoldCards.length < 6)
			this.addHoldCard(card);
		else
			this.addHandCard(card);
	}
	
	Hand.prototype.addListHand = function(list){
		if(list[0] instanceof CardInfo){
			for(var i = 0; i < list.length; i++)
				this.addHandCard(list[i].card);
		}
		else if (list[0] instanceof Card){
			for(var i = 0; i < list.length; i++)
				this.addHandCard(list[i]);
		}
	}	
	
	Hand.prototype.removeHandCard = function(cardIndex){
		this.listOfHandCards.splice(cardIndex, 1);
		for(var i = cardIndex; i < this.listOfHandCards.length; i++){
			var newPosition = this.getHandPositionAt(i);
			this.listOfHandCards[i].updatePosition(newPosition.x, newPosition.y);
		}
	}
	
	Hand.prototype.removeHoldCard = function(cardIndex){
		this.listOfHoldCards.splice(cardIndex, 1);	
	}
	
	Hand.prototype.removeCard = function(cardInfo){
		if(!(cardInfo instanceof CardInfo)){
			printLog("Please provide CardInfo type for Hand.removeCard()");
			return;
		}
		if(cardInfo.cardType == HOLD_DOWN_CARD || cardInfo.cardType == HOLD_UP_CARD)
			this.removeHoldCard(cardInfo.index);
		else
			this.removeHandCard(cardInfo.index);
		
	}
	
	Hand.prototype.removeList = function(list){
		if(!(list[0] instanceof CardInfo)){
			printLog("Hand cannot remove list without Card Info!");
			return;
		}
		list.sort(function(a, b){return b.index - a.index;});
		for(var i = 0; i < list.length; i++)		
			this.removeCard(list[i]);
	}
	
	Hand.prototype.draw = function(){
		for(var i = 0; i < this.listOfHoldCards.length; i++)
			this.listOfHoldCards[i].draw();	
		for(var i = 0; i < this.listOfHandCards.length; i++)
			this.listOfHandCards[i].draw();	
	}
	
	//Check mouse detection
	Hand.prototype.isClicked = function(){
		var cardType;
		for(var i = this.listOfHoldCards.length - 1; i >= 0; i--){
			var card = this.listOfHoldCards[i];
		
			if(mX < card.right && mX > card.left && mY < card.bot && mY > card.top){
				if(i < 3)
					cardType = HOLD_DOWN_CARD;
				else if(i < 6)
					cardType = HOLD_UP_CARD;
				return new CardInfo(card, cardType, i, this.listOfHoldCards);
			}
		}
		for(var i = this.listOfHandCards.length - 1; i >= 0; i--){			
			var card = this.listOfHandCards[i];
			cardType = PLAY_CARD;

			if(mX < card.right && mX > card.left && mY < card.bot && mY > card.top)
				return new CardInfo(card, cardType, i, this.listOfHandCards);
		}
		return false;
	}
	
	//...IN PROGRESS...
	Hand.prototype.run = function(){
		var cardInfo = this.isClicked();//return [card, cardType, index, list]
		if(cardInfo !== false){					
			if(currentTurn !== this.id){
				printLog(currentPlayer.name + ", you should NOT touch " + this.name + "'s card! Don't be a BUTTHOLE!");
				return false;
			}
			if(cardInfo.cardType == HOLD_DOWN_CARD && (this.listOfHoldCards.length > 3 || this.listOfHandCards.length > 0)){
				printLog("You have to finish all cards on hand and face up hold cards before you can play this card!");
				return false;
			}
			if(game_state == SWAP_STATE)
				this.swap(cardInfo);
			else if(game_state == PLAY_STATE){
				if(cardInfo.cardType == HOLD_UP_CARD){
					if(this.listOfHandCards.length > 0){
						printLog("You have to finish all cards on hand before you can play this card!");
						return false;
					}
				}
				var ret = this.play(cardInfo);//1 if move is finished, 0 if move is not made, 10 if move is made but allows 1 more move
				if(ret === 1){			
					updateTurn();
				}
				else if(ret === 10)
					if(checkWin()) return true;
			}
			finishRun();	
			return true;
		}
	}
		
	
	
	//return 1 if move is finished, 0 if move is not made, 10 if move is made but allows 1 more move
	Hand.prototype.play = function(cardInfo){
		if(mB == 'l'){
			if(cardInfo.card.side == BACK){//play HOLD_DOWN_CARD or DECK_TOP_CARD
				this.removeCard(cardInfo);
				return pile.receiveCard(cardInfo.card);
			}
			else if(cardInfo.card.select != -1){//play multiple cards
				var sendList = this.listOfSelectCards;
				this.unselectAllCards();
				this.removeList(sendList);
				return pile.receiveList(sendList);	//what happen to list of 10s, one more turn
			}
			else{//play one card
				if(pile.verifyMove(cardInfo.card)){
					this.removeCard(cardInfo);//get card out to hand and put it on pile
					return pile.receiveCard(cardInfo.card);
				}
				else{//invalid move
					printLog("You cannot play " + READABLE[cardInfo.card.rank] + " on top of " + READABLE[pile.getTopCard().rank] + ".");
					return 0;
				}
			}
		}
		else{//Right mouse, not play
			if(cardInfo.card.side == BACK)
				printLog("You can not select multiple card with this card!");
			else if(this.listOfSelectCards.length > 0){//Select multiple cards
				lastRank = this.listOfSelectCards[0].card.rank;
				if(cardInfo.card.rank == lastRank)
					this.handleSelect(cardInfo);
				else
					printLog("You cannot play " + READABLE[lastRank] + " with " + READABLE[cardInfo.card.rank]);
			}
			else{//select first card
				if(pile.verifyMove(cardInfo.card))
					this.handleSelect(cardInfo);
				else
					printLog("You cannot play " + READABLE[cardInfo.card.rank] + " on top of " + READABLE[pile.getTopCard().rank]);
			}
			return 0;
		}
	}
	
	
	Hand.prototype.swap = function(currentInfo){	
		if(currentInfo.card.select != -1)//unselect currentInfo.card
			this.unselectCard(currentInfo);
		else{
			if(this.listOfSelectCards.length > 0){//check with card already selected
				var otherInfo = this.listOfSelectCards[0];

				if(currentInfo.cardType == otherInfo.cardType){
					if(currentInfo.cardType == HOLD_UP_CARD || currentInfo.cardType == HOLD_DOWN_CARD)
						printLog("You should choose a card on your hand!");
					else
						printLog("You should choose a card in your hold!");
				}
				else{
					//reset needs to be before swap because it may mess up position
					this.unselectAllCards();
					//swap
					this.exchangeCardsBetweenLists(currentInfo, otherInfo);				
				}
			}
			else
				this.selectCard(currentInfo);
		}			
	}
	
	Hand.prototype.exchangeCardsBetweenLists = function(cardInfoA, cardInfoB){		
		//exchange position
		var bX = cardInfoB.card.x;
		var bY = cardInfoB.card.y;
		cardInfoB.card.updatePosition(cardInfoA.card.x, cardInfoA.card.y);
		cardInfoA.card.updatePosition(bX, bY);
		
		//exchange element between list
		var listA = cardInfoA.list;
		var listB = cardInfoB.list;
		var indexA = cardInfoA.index;
		var indexB = cardInfoB.index;
		listA[indexA] = cardInfoB.card;
		listB[indexB] = cardInfoA.card;
	}
	Hand.prototype.handleSelect = function(currentInfo){
		if(currentInfo.card.select != -1)
			this.unselectCard(currentInfo);
		else
			this.selectCard(currentInfo);
	}
		
	Hand.prototype.selectCard = function(cardInfo){
		this.listOfSelectCards.push(cardInfo);
		cardInfo.card.updatePosition(cardInfo.card.x, cardInfo.card.y - 20);
		cardInfo.card.select = this.listOfSelectCards.length - 1;	
	}
	
	Hand.prototype.unselectCard = function(cardInfo){
		var currentCard = cardInfo.card;
		var selectIndex = currentCard.select;
		if(selectIndex == -1) return;
		this.listOfSelectCards.splice(selectIndex, 1);
		for(var i = selectIndex; i < this.listOfSelectCards.length; i++)
			this.listOfSelectCards[i].card.select--;
		currentCard.updatePosition(currentCard.x, currentCard.y + 20);
		currentCard.select = -1;
	}
	
	Hand.prototype.unselectAllCards = function(){
		for(var i = 0; i < this.listOfSelectCards.length; i++){
			var currentCard = this.listOfSelectCards[i].card;
			currentCard.updatePosition(currentCard.x, currentCard.y + 20);
			currentCard.select = -1;
		}
		this.listOfSelectCards = [];
	}
		
	Hand.prototype.flipAndRestore = function(){
		//TODO
	}
	//********************************************************************************************	
	//PILE CARD CLASS
	function Pile(){
		this.listOfCards = [];
		this.x = middleX - CARD_CENTER[0] + 20;
		this.y = middleY - CARD_CENTER[1];
	}
	
	Pile.prototype.addCard = function(card){
		if(typeof card === 'undefined' || card === null )
			printLog("No card to add!");
		else if(!(card instanceof Card))
			printLog("This is not a card! Cannot add!");
		else{
			if(!card.side) card.side = FRONT;//flip			
			card.updatePosition(this.x, this.y);
			this.listOfCards.push(card);
		}
	}
	
	Pile.prototype.addList = function(list){
		if(list[0] instanceof CardInfo){
			for(var i = 0; i < list.length; i++)
				this.addCard(list[i].card);
		}
		else if (list[0] instanceof Card){
			for(var i = 0; i < list.length; i++){
				this.addCard(list[i]);
			}
		}
	}
	
	Pile.prototype.sendAll = function(){
		currentPlayer.addListHand(this.listOfCards);
		this.listOfCards = [];
	}
	
	Pile.prototype.verifyMove = function(card){
		if(card instanceof CardInfo) card = card.card;
		if(card.rank == BURN_CARD || card.rank == RESTART_CARD || card.rank == REVERSE_CARD)
			return true;
		var topCard = this.getTopCard();
		if(typeof topCard == 'undefined' || topCard == null )
			return true;
		else if(topCard.rank == REVERSE_CARD)
			return VALUES[card.rank] <= VALUES[topCard.rank];
		else
			return VALUES[card.rank] >= VALUES[topCard.rank];
	}
	
	//return 1 if move is finished, 0 if move is not made, 10 if move is made but allows 1 more move
	Pile.prototype.receiveCard = function(card){
		this.makeHandThree();
		listTrackPile = [card];
		var valid = this.verifyMove(card);
		var sameRankCount = 1;
		var len = this.listOfCards.length;	
		for(var i = len - 1; valid && i >= 0; i--){
			if(this.listOfCards[i].rank === card.rank)
				sameRankCount++;
			else
				break;
		}
		this.addCard(card);		
		if(valid){		
			if(card.rank == BURN_CARD || sameRankCount == 4){
				this.burn();
				return 10;//need one more card lol!
			}
			return 1;
		}
		else{
			this.sendAll();
			return 1;
		}
	}

	//return 1 if move is finished, 0 if move is not made, 10 if move is made but allows 1 more move
	Pile.prototype.receiveList = function(list){
		this.makeHandThree();
		listTrackPile = list;
		card = list[0].card;
		var valid = this.verifyMove(card);
		
		var sameRankCount = list.length;
		var len = this.listOfCards.length;	
		for(var i = len - 1; valid && i >= 0; i--){
			if(this.listOfCards[i].rank == card.rank)
				sameRankCount++;
			else
				break;
		}
		
		for(var i = 0; i < list.length; i++)
			this.addCard(list[i].card);		
		if(valid){	
			if(list.length == 4 || card.rank == BURN_CARD || sameRankCount == 4){
				this.burn();
				return 10;//need one more card lol!
			}
			return 1;
		}
		else{
			this.sendAll();
			return 1;
		}
	}
		
	Pile.prototype.burn = function(){
		this.listOfCards = [];
		trackPile();
	}
	
	Pile.prototype.makeHandThree = function(){
		if(currentPlayer.listOfHandCards.length < 3 && !deck.isEmpty()){
			var len = currentPlayer.listOfHandCards.length;
			for(var i = 0; i < 3 - len; i++)
				currentPlayer.addHandCard(deck.dealCard());
		}
	}
	
	Pile.prototype.getTopCard = function(){
		return this.listOfCards[this.listOfCards.length - 1];
	}
	
	Pile.prototype.draw = function(){
		for(var i = 0; i < this.listOfCards.length; i++)
			this.listOfCards[i].draw();
	}
	
	Pile.prototype.isClicked = function(){
		var len = this.listOfCards.length;
		if(len === 0) return false;
		var cardType;

		var card = this.listOfCards[this.listOfCards.length - 1];
		cardType = PILE_CARD;
		if(mX < card.right && mX > card.left && mY < card.bot && mY > card.top)
			return [card, cardType, this.listOfCards.length - 1, this.listOfCards];

		return false;
	}
	
	Pile.prototype.run = function(){
		var cardInfo = this.isClicked();
		if(cardInfo != false){
			this.sendAll();
			updateTurn();
		}
		finishRun();
		return true;
	}
	//********************************************************************************************	
	//DECK CLASS
	function Deck(){
		this.listOfCards = [];
		for(var i = 0; i < SUITS.length; i++){
			for(var j = 0; j < RANKS.length; j++){
				this.listOfCards.push(new Card(FRONT, 0, 0, SUITS[i], RANKS[j]));
			}
		}
	}
	
	Deck.prototype.shuffle = function(){
		//Fisher-Yates Shuffle
		var counter = this.listOfCards.length, random_index, temp
		while(counter > 0){
			random_index = Math.floor(Math.random() * counter);
			
			temp = this.listOfCards[--counter];
			this.listOfCards[counter] = this.listOfCards[random_index];
			this.listOfCards[random_index] = temp;
		}
	}
	
	Deck.prototype.dealCard = function(){
		if(this.isEmpty()) 
			printLog("The deck is empty!");
		else
			return this.listOfCards.splice(Math.floor(Math.random() * this.listOfCards.length), 1)[0];
	}
	
	Deck.prototype.isEmpty = function(){
		return this.listOfCards.length === 0;
	}
	
	Deck.prototype.joinCards = function(){
		var s = "";
		for(var i = 0; i < this.listOfCards.length; i++)
			s += this.listOfCards[i] + " ";
		return s;
	}
	
	Deck.prototype.toString = function(){
		var s = "Deck constains " + this.joinCards();
		return s;
	}
	
	Deck.prototype.drawDummy = function(){
		this.deckDepth = Math.ceil(this.listOfCards.length / 52 * 10);
		this.dummyCards = [];
		for(var i = 0; i < this.deckDepth; i++){
			var card = new Card(BACK, middleX - 100 - CARD_CENTER[0] - (2 * i), middleY - CARD_CENTER[1] - (2 * i));
			this.dummyCards.push(card);
			card.draw();
		}
	}
		
	//Check mouse detection on dummyCards
	Deck.prototype.isClicked = function(){
		var len = this.dummyCards.length;
		if(len === 0) return false;
		var cardType;
		for(var i = len - 1; i >= 0; i--){
			var card = this.dummyCards[i];
			if(i == len - 1)
				cardType = DECK_TOP_CARD;
			else
				cardType = DECK_BOT_CARD;

			if(mX < card.right && mX > card.left && mY < card.bot && mY > card.top){
				return new CardInfo(card, cardType);//no need to return list since it's a dummy.
			}
		}
		return false;
	}
	
	//...IN PROGRESS...
	Deck.prototype.run = function(){
		var cardInfo = deck.isClicked();//return [card, cardType, index]
		if(cardInfo !== false){
			if(cardInfo.cardType == DECK_TOP_CARD){
				if(game_state == DEAL_STATE){
					/*
					this.dealPlayer(1);
					updateTurn();
					if(currentPlayer.len == 9){nextGameState();}
					/*/
					this.dealAllPlayers(9);
					nextGameState();
				}
				else if(game_state == SWAP_STATE)
					printLog("This card cannot be swaped. Please choose cards from your hand!");
				else if(game_state == PLAY_STATE)
					this.play();
			}
			else
				printLog("Please draw card from top of the deck!");
			finishRun();
			return true;
		}
	}
	
	Deck.prototype.play = function(){
		pile.receiveCard(this.dealCard());
		updateTurn();
	}
	
	Deck.prototype.dealPlayer = function(numberOfCards){
		for(var i = 0; i < numberOfCards; i++)
			currentPlayer.addCard(deck.dealCard());
	}
	
	Deck.prototype.dealAllPlayers = function(numberOfCards){
		//Deliver those first cards to start game
		for(var i = 0; i < numberOfCards; i++){
			for(var j = 0; j < NUMBER_OF_PLAYER; j++){
				if(this.listOfCards.length === 0){
					printLog("No more card to deal!");
					return;
				}
				currentPlayer.addCard(deck.dealCard());
				updateTurn();	
			}
		}
	}
	//********************************************************************************************	
	//Global variables
	var deck, playerA, playerB, pile;
	var listOfPlayers = []
	var game_state;
	var currentTurn, currentPlayer;
	var NUMBER_OF_PLAYER = 2;
	var swap_turn;
	var state = "";
	var button;
	var listTrackPile = [];
	
	//MAIN FUNCTION
	function init(){
		canvas = document.getElementById('myCanvas');
		canvas.width = WIDTH + 300;
		canvas.height = HEIGHT;
		context = canvas.getContext("2d");
		context.beginPath();
		context.rect(0, 0, WIDTH, HEIGHT);
		context.fillStyle = "Green";
		context.fill();
			
		/*
		Fix ID for each player, only good for fix players
		For dynamic adding and removing player, better use following scheme:
			currentTurn; //keep track of turn and id from 0...listID.length
			listID; //have all player's id. IE, currentTurn return 1; listID[currentTurn] return an ID, then run for loop to find player with that ID.
			listOfPlayers;
		*/
		var PLAYER_A = 0, PLAYER_B = 1;
		game_state = ZERO_STATE;
		swap_turn = 0; 
		
		
		pile = new Pile();
		deck = new Deck();		
		listOfPlayers = [];
		playerA = new Hand(50, HEIGHT - CARD_SIZE[1] - 50, PLAYER_A, "Player A");
		playerB = new Hand(50, 0 + 50, PLAYER_B, "Player B");
		listOfPlayers.push(playerA);
		listOfPlayers.push(playerB);
		
		//default turn
		currentPlayer = playerA;
		currentTurn = playerA.id;
		
		button = document.getElementById("control_button");	
		//button.style.left = '500px';
		//button.style.top = '260px';
		
		deck.shuffle();		
		
		nextGameState();
		
		canvas.onmousedown = mouseDown;
		//disable right mouse click
		canvas.oncontextmenu = function (e) {
			e.preventDefault();
		};
		
		finishRun();
	}

	function redraw(){
		clear();
		for(var i = 0; i < listOfPlayers.length; i++)
			listOfPlayers[i].draw();
		deck.drawDummy();
		pile.draw();
	}
	
	function clear(){
		context.clearRect(0, 0, WIDTH, HEIGHT);
		context.fillRect(0, 0, WIDTH, HEIGHT);
	}
	//********************************************************************************************	
	//LOGIC STARTS HERE
	function mouseDown(e){
		getMousePosition(e);
		getMouseButton(e);
		e.preventDefault();
		var move = false;
		
		var len = listOfPlayers.length;
		for(var i = 0; i < len; i++){
			var player = listOfPlayers[i];
			move = player.run();
			if(move) return;
		}
		
		move = deck.run();
		if(move) return;
		
		move = pile.run();
		if(move) return;
	}
		
	function finishRun(){
		redraw();
	}

	function fakeDeal(){
		currentPlayer.addCard(new Card(FRONT, 0, 0, 'H', 'T'));
		updateTurn();
		currentPlayer.addCard(new Card(FRONT, 0, 0, 'D', 'T'));
		updateTurn();
	}
	
	function nextGameState(){
		game_state += 1;
		if(game_state == DEAL_STATE){
			state = "Deal";
			button.innerText = "Deal";
			button.onclick = function(){
				deck.dealAllPlayers(9);
				//fakeDeal();
				nextGameState();
				finishRun();
			}
			printLog("Please click on top of deck card to deal.");
		}		
		else if(game_state == SWAP_STATE){
			button.innerText = currentPlayer.name + " finishes swap!";
			button.onclick = function(){
				updateTurn();
				button.innerText = currentPlayer.name + " finishes swap!";
			}
			state = "Swap";
			printLog("You can swap your hand cards with your hold cards now.");
		}
		else if(game_state == PLAY_STATE){
			button.innerText = '';
			button.style.display = 'none';
			state = "Play";
			printLog("You can play now!");
		}
		else if(game_state == WIN_STATE){
			button.innerText = 'New Game?';
			button.style.display = 'initial';
			button.style.left = '300px';
			button.style.top = '300px';
			button.onclick = function(){
				game_state = 0;
				init();
			}
			state = "Win";
			printLog("Congratulation " + currentPlayer.name + "! You won this round!");
			clear();
		}
	}
	
	function checkWin(){
		if(currentPlayer.getTotalLen() == 0 && game_state == PLAY_STATE){//WIN CONDITION
			nextGameState();
			return true;
		}
		return false;
	}
	
	function updateTurn(){
		if(checkWin()) return;
		
		currentTurn = ++currentTurn % NUMBER_OF_PLAYER;
		for(var i = 0; i < listOfPlayers.length; i++){
			if(currentTurn == listOfPlayers[i].id)
				currentPlayer = listOfPlayers[i];
		}
		
		if(game_state == SWAP_STATE){
			swap_turn++;
			if(swap_turn == NUMBER_OF_PLAYER){
				nextGameState();			
				return;
			}
		}
			
		if(game_state != DEAL_STATE){
			var len = listTrackPile.length;
			if(!trackPile())
				printLog("");			
		}
	}
	
	function trackPile(){
		var len = listTrackPile.length;
		if(len > 0){
			var s = 'Pile received '
			if(len == 1)
				s += READABLE[listTrackPile[0].rank] + " of " + READABLE[listTrackPile[0].suit];
			else{
				for(var i = 0; i < len; i++){
					s += READABLE[listTrackPile[i].card.rank] + ' of ' + READABLE[listTrackPile[i].card.suit];
					if(i == len - 2) s += ' and ';
					else if( i < len - 2) s+= ', ';
				}
			}
			printLog(s + ".");
			return true;
		}
		return false;
	}
	
	function printLog(log){
		var headMessage = "Current game state: " + state + "<br/>Player turn: " + currentPlayer.name + ".<br/>";
		log = headMessage + log;
		document.getElementById('output').innerHTML = log;
		console.log(log);
	}
	
	//source: http://stackoverflow.com/questions/2405771/is-right-click-a-javascript-event
	function getMouseButton(e){
		e = e || window.event;

		if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
			mB = e.which == 3?'r':'l'; 
		else if ("button" in e)  // IE, Opera 
			mB = e.button == 2?'r':'l'; 
	}
	
	//source: http://www.kirupa.com/html5/getting_mouse_click_position.htm
	function getMousePosition(e) {
		var parentPosition = getParentPosition(e.currentTarget);
		mX = e.clientX - parentPosition.x;
		mY = e.clientY - parentPosition.y;
	}
 
	function getParentPosition(element) {
		var xPosition = 0;
		var yPosition = 0;
		  
		while (element) {
			xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
			yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
			element = element.offsetParent;
		}
		return { x: xPosition, y: yPosition };
	}
