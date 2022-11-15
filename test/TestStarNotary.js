const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]}) //creation of a star 
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!') //check name of star 
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1}); //creation of star 
    await instance.putStarUpForSale(starId, starPrice, {from: user1}); // put for sale 
    assert.equal(await instance.starsForSale.call(starId), starPrice); //check that the star is for sale
});

it("lets user1 get the funds after the sale", async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar("awesome star", starId, { from: user1 }); //creation of star 
    await instance.putStarUpForSale(starId, starPrice, { from: user1 }); // put for sale 
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1); //balance of user 
    //requires that the caller is the owner or approved to transfer that token. `user2` 
    //is not the token owner so it has to be approved.
    await instance.approve(user2, starId, {from: user1, gasPrice: 0})
    await instance.buyStar(starId, { from: user2, value: balance, gasPrice: 0});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    //Check that the funds were transmitted
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
  });

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    //requires that the caller is the owner or approved to transfer that token. `user2` 
    //is not the token owner so it has to be approved.
    await instance.approve(user2, starId, {from: user1, gasPrice: 0})
    await instance.buyStar(starId, {from: user2, value: balance});
    //Check that the star was sold 
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    //requires that the caller is the owner or approved to transfer that token. `user2` 
    //is not the token owner so it has to be approved.
    await instance.approve(user2, starId, {from: user1, gasPrice: 0})
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    //Check that the funds were transmitted
    assert.equal(value, starPrice);
  });

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    let tokenId = 8;
    let instance = await StarNotary.deployed();
    await instance.createStar("superStar!", tokenId, {from: accounts[0]}) //create the star in account 0
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let name = await instance.name();
    let symbol = await instance.symbol();
    let findSuperStar = await instance.lookUptokenIdToStarInfo(tokenId);

    assert.equal(name,"StarNotary");
    assert.equal(symbol,"STRN");
    assert.equal(findSuperStar,"superStar!");
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    let instance = await StarNotary.deployed();
    let tokenId1 = 7;
    let tokenId2 = 6;
    let user1 = accounts[0];
    let user2 = accounts[1];
    await instance.createStar("superStar!1", tokenId1, {from: user1}) //user1 owns tokenId1 (create the star in user1 account)
    await instance.createStar("superStar!2", tokenId2, {from: user2}) //user2 owns tokenId2 (create the star in user2 account)
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.approve(user2, tokenId1, {from: user1, gasPrice: 0})  //requires that the caller is the owner or approved to transfer that token
    await instance.approve(user1, tokenId2, {from: user2, gasPrice: 0})  //requires that the caller is the owner or approved to transfer that token
    await instance.exchangeStars(tokenId1, tokenId2, {from: user1});
    // 3. Verify that the owners changed
    assert.equal(await instance.ownerOf.call(tokenId1), user2); // user2 should own tokenId1
    assert.equal(await instance.ownerOf.call(tokenId2), user1); // user1 should own tokenId2
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let tokenId3 = 10;
    let user1 = accounts[0];
    let user2 = accounts[1];
    await instance.createStar("superStar!3", tokenId3, {from: user1}) // create the star in user1 account
    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(user2, tokenId3, {from: user1}); // transfer user1 star to user2 by tokenId3
    // 3. Verify the star owner changed.
    assert.equal(await instance.ownerOf.call(tokenId3), user2); // user2 should own tokenId3
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let tokenId4 = 11;
    let user1 = accounts[0];
    await instance.createStar("superStar!4", tokenId4, {from: user1}) //create the star in user1 account
    // 2. Call your method lookUptokenIdToStarInfo
    await instance.lookUptokenIdToStarInfo(tokenId4);
    // 3. Verify if you Star name is the same
    assert.equal(await instance.lookUptokenIdToStarInfo.call(tokenId4), "superStar!4"); // should be same star name
});