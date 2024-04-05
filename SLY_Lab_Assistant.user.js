// ==UserScript==
// @name         SLY Lab Assistant
// @namespace    http://tampermonkey.net/
// @version      0.4.3
// @description  try to take over the world!
// @author       SLY w/ Contributions by SkyLove512, anthonyra, niofox
// @match        https://*.labs.staratlas.com/
// @require      https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js
// @require      https://raw.githubusercontent.com/zio731/starbased/main/anchor-browserified.js
// @require      https://raw.githubusercontent.com/zio731/starbased/main/buffer-browserified.js
// @require      https://raw.githubusercontent.com/zio731/starbased/main/bs58-browserified.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staratlas.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// ==/UserScript==

(async function() {
    'use strict';

    let enableAssistant = false;
    let initComplete = false;
    let rpcEndpoints = ['https://rpc.hellomoon.io/cfd5910f-fb7d-4489-9b32-f97193eceefd','https://solana-api.syndica.io/access-token/WPoEqWQ2auQQY1zHRNGJyRBkvfOLqw58FqYucdYtmy8q9Z84MBWwqtfVf8jKhcFh/rpc'];
    const priorityFee = 1; // Priority Fee added to each transaction in Lamports. Set to 0 (zero) to disable priority fees. 1 Lamport = 0.000000001 SOL

    const connectionProxy = {
        get(target, key, receiver) {
            const origMethod = target[key];
            if(typeof origMethod === 'function'){
                return async function (...args) {
                    let result;
                    try {
                        result = await origMethod.apply(target, args);
                    } catch (error1) {
                        console.log('CONNECTION ERROR: ', error1);
                        console.log('type: ', typeof error1);
                        console.log('name: ', error1.name);
                        console.log('message: ', error1.message);
                        if (error1.message.includes('Failed to fetch') || (error1 instanceof Error && Number(error1.message.slice(0,3)) > 299)) {
                            let success = false;
                            let rpcIdx = 1;
                            while (!success && rpcIdx < rpcEndpoints.length) {
                                console.log('rpcIdx: ', rpcIdx, ', success: ', success);
                                const newConnection = new solanaWeb3.Connection(rpcEndpoints[rpcIdx], 'confirmed');
                                try {
                                    result = await origMethod.apply(newConnection, args);
                                    success = true;
                                    console.log('NEW: ', result);
                                } catch (error2) {
                                    console.log('INNER ERROR: ', error2);
                                    if (!(error2 instanceof TypeError && error2.message === 'Failed to fetch') && !(error2 instanceof Error && Number(error2.message.slice(0,3)) > 299)) {
                                        return error2;
                                    }
                                }
                                rpcIdx = rpcIdx+1 < rpcEndpoints.length ? rpcIdx+1 : 0;
                            }
                        }
                    }
                    return result;
                }
            }
        },
    }

    //const rawSolanaConnection = new solanaWeb3.Connection('https://solana-api.syndica.io/access-token/WPoEqWQ2auQQY1zHRNGJyRBkvfOLqw58FqYucdYtmy8q9Z84MBWwqtfVf8jKhcFh/rpc', 'confirmed');
    const rawSolanaConnection = new solanaWeb3.Connection(rpcEndpoints[0], 'confirmed');
    const solanaConnection = new Proxy(rawSolanaConnection, connectionProxy);
    const anchorProvider = new BrowserAnchor.anchor.AnchorProvider(solanaConnection, null, null);
    window.Buffer = BrowserBuffer.Buffer.Buffer;

    const sageIDL = JSON.parse('{"version":"0.1.0","name":"sage","instructions":[{"name":"activateGameState","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":true,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":true,"isSigner":false,"docs":["The [`GameState`] account"]}],"args":[{"name":"input","type":{"defined":"ManageGameInput"}}]},{"name":"addConnection","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for adding the connection"]},{"name":"sector1","isMut":true,"isSigner":false,"docs":["The first connected sector"]},{"name":"sector2","isMut":true,"isSigner":false,"docs":["The second connected sector"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"subCoordinates1","type":{"array":["i64",2]}},{"name":"flags1","type":"u8"},{"name":"subCoordinates2","type":{"array":["i64",2]}},{"name":"flags2","type":"u8"},{"name":"keyIndex","type":"u16"}]},{"name":"addRental","accounts":[{"name":"ownerProfile","isMut":false,"isSigner":false,"docs":["The fleet owners profile."]},{"name":"ownerKey","isMut":false,"isSigner":true,"docs":["The key on the owner profile with renting permissions."]},{"name":"invalidator","isMut":false,"isSigner":true,"docs":["This is a signer to help make sure the fleet wont be locked."]},{"name":"subProfile","isMut":false,"isSigner":false,"docs":["The profile to rent to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet to rent out."]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]}],"args":[{"name":"ownerKeyIndex","type":"u16"}]},{"name":"addShipEscrow","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder - pays for account rent"]},{"name":"sagePlayerProfile","isMut":true,"isSigner":false,"docs":["The [`SagePlayerProfile`] account"]},{"name":"originTokenAccount","isMut":true,"isSigner":false,"docs":["The Origin Token Account"]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`] Account"]},{"name":"shipEscrowTokenAccount","isMut":true,"isSigner":false,"docs":["The Escrow Token Account"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The Token Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"AddShipEscrowInput"}}]},{"name":"addShipToFleet","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new `Fleet`"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`] Account"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"AddShipToFleetInput"}}]},{"name":"cancelCraftingProcess","accounts":[{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":true,"isSigner":false,"docs":["The [`CraftingInstance`] account to cancel"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The crafting process account"]},{"name":"craftingFacility","isMut":true,"isSigner":false,"docs":["The `CraftingFacility` account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]}],"args":[{"name":"input","type":{"defined":"StarbaseCancelCraftingProcessInput"}}]},{"name":"changeRental","accounts":[{"name":"subProfileInvalidator","isMut":false,"isSigner":true,"docs":["This is a signer to help make sure the fleet wont be locked."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet to rent out."]},{"name":"newSubProfile","isMut":false,"isSigner":false,"docs":["The new sub profile"]}],"args":[]},{"name":"claimCraftingNonConsumables","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":false,"isSigner":false,"docs":["The [`CraftingInstance`] account"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The crafting process account"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting recipe"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source account of the tokens - owner should be `crafting_process`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination account of the tokens - owner should be `cargo_pod_to`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The token mint"]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The [Token] program"]}],"args":[{"name":"input","type":{"defined":"StarbaseClaimCraftingNonConsumablesInput"}}]},{"name":"claimCraftingOutputs","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":false,"isSigner":false,"docs":["The [`CraftingInstance`] account"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The [`CraftingProcess`] account"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting [`Recipe`]"]},{"name":"craftableItem","isMut":false,"isSigner":false,"docs":["The craftable item"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source account of the tokens - owner should be `craftable_item`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination account of the tokens - owner should be `cargo_pod_to`"]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The [Token] program"]}],"args":[{"name":"input","type":{"defined":"StarbaseClaimCraftingOutputInput"}}]},{"name":"closeCraftingProcess","accounts":[{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":true,"isSigner":false,"docs":["The [`CraftingInstance`] account to close"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The crafting process account"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting recipe account"]},{"name":"craftingFacility","isMut":true,"isSigner":false,"docs":["The `CraftingFacility` account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]}],"args":[{"name":"input","type":{"defined":"StarbaseCloseCraftingProcessInput"}}]},{"name":"closeDisbandedFleet","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the player profile."]},{"name":"playerProfile","isMut":false,"isSigner":false,"docs":["The player profile."]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"disbandedFleet","isMut":true,"isSigner":false,"docs":["The [`DisbandedFleet`] account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]}],"args":[{"name":"input","type":{"defined":"CloseDisbandedFleetInput"}}]},{"name":"closeFleetCargoPodTokenAccount","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The cargo pod, owned by the fleet"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"token","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `cargo_pod`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"closeStarbaseCargoTokenAccount","accounts":[{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The new cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"token","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"copyGameState","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new `GameState`"]},{"name":"oldGameState","isMut":false,"isSigner":false,"docs":["The old [`GameState`] account"]},{"name":"newGameState","isMut":true,"isSigner":false,"docs":["The [`GameState`] account","This will and should fail if there already exists a `GameState`for the desired `update_id`"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"ManageGameInput"}}]},{"name":"createCargoPod","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new crafting process"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The new cargo pod"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"StarbaseCreateCargoPodInput"}}]},{"name":"createCraftingProcess","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new crafting process"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":true,"isSigner":false,"docs":["The [`CraftingInstance`] account to initialize"]},{"name":"craftingFacility","isMut":true,"isSigner":false,"docs":["The `CraftingFacility` account"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The crafting process account (NOT initialized)"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting recipe"]},{"name":"craftingDomain","isMut":false,"isSigner":false,"docs":["The crafting domain"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["Solana System program"]}],"args":[{"name":"input","type":{"defined":"StarbaseCreateCraftingProcessInput"}}]},{"name":"createFleet","accounts":[{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new `Fleet`"]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The [`Fleet`] account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"cargoHold","isMut":true,"isSigner":false,"docs":["The new fleet `cargo_hold` cargo pod (not initialized)"]},{"name":"fuelTank","isMut":true,"isSigner":false,"docs":["The new fleet `fuel_tank` cargo pod (not initialized)"]},{"name":"ammoBank","isMut":true,"isSigner":false,"docs":["The new fleet `ammo_bank` cargo pod (not initialized)"]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`] Account - represents the first ship in the new fleet"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"CreateFleetInput"}}]},{"name":"depositCargoToFleet","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoPodFrom","isMut":true,"isSigner":false,"docs":["The origin cargo pod"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod_from`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `cargo_pod_to`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"DepositCargoToFleetInput"}}]},{"name":"depositCargoToGame","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The new cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `key`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `cargo_pod`"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"CargoToGameInput"}}]},{"name":"depositCraftingIngredient","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":false,"isSigner":false,"docs":["The [`CraftingInstance`] account"]},{"name":"craftingFacility","isMut":false,"isSigner":false,"docs":["The [`CraftingFacility`](crafting::CraftingFacility) account"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The crafting process account"]},{"name":"cargoPodFrom","isMut":true,"isSigner":false,"docs":["The source cargo pod account"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting recipe"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source account of the tokens - owner should be `cargo_pod_from`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination account of the tokens - owner should be `crafting_process`"]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The [Token] program"]}],"args":[{"name":"input","type":{"defined":"StarbaseDepositCraftingIngredientInput"}}]},{"name":"deregisterMineItem","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the closing funds go."]},{"name":"mineItem","isMut":true,"isSigner":false,"docs":["The [`MineItem`] account"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"deregisterResource","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the closing funds go."]},{"name":"mineItem","isMut":true,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]},{"name":"location","isMut":true,"isSigner":false,"docs":["The Location address"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"deregisterStarbase","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the closing funds go."]},{"name":"starbase","isMut":true,"isSigner":false,"docs":["The [`Starbase`] account"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"deregisterSurveyDataUnitTracker","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the closing funds go."]},{"name":"surveyDataUnitTracker","isMut":true,"isSigner":false,"docs":["The [`SurveyDataUnitTracker`] account"]}],"args":[{"name":"input","type":{"defined":"DeregisterSurveyDataUnitTrackerInput"}}]},{"name":"disbandFleet","accounts":[{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder - pays for account rent"]},{"name":"disbandedFleet","isMut":true,"isSigner":false,"docs":["The [`DisbandedFleet`] account"]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The [`Fleet`] account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"cargoHold","isMut":true,"isSigner":false,"docs":["The fleet `cargo_hold` cargo pod"]},{"name":"fuelTank","isMut":true,"isSigner":false,"docs":["The fleet `fuel_tank` cargo pod"]},{"name":"ammoBank","isMut":true,"isSigner":false,"docs":["The fleet `ammo_bank` cargo pod"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"DisbandFleetInput"}}]},{"name":"disbandedFleetToEscrow","accounts":[{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder - pays for account rent"]},{"name":"disbandedFleet","isMut":true,"isSigner":false,"docs":["The [`DisbandedFleet`] account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`] Account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"DisbandedFleetToEscrowInput"}}]},{"name":"drainMineItemBank","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the closing funds go."]},{"name":"mineItem","isMut":true,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The mine item token bank to drain"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["Where to send tokens from the bank"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The [Token] program"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"drainSurveyDataUnitsBank","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the closing rent refunds go."]},{"name":"surveyDataUnitTracker","isMut":false,"isSigner":false,"docs":["The [`SurveyDataUnitTracker`] account"]},{"name":"surveyDataUnitTrackerSigner","isMut":false,"isSigner":false,"docs":["The `SurveyDataUnitTracker` signer"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The SDU token bank to drain"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["Where to send tokens from the bank"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The [Token] program"]}],"args":[{"name":"input","type":{"defined":"KeyIndexInput"}}]},{"name":"fleetStateHandler","accounts":[{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}],"args":[]},{"name":"forceDisbandFleet","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder - pays for account rent"]},{"name":"disbandedFleet","isMut":true,"isSigner":false,"docs":["The new [`DisbandedFleet`] account"]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The [`Fleet`] account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"cargoHold","isMut":true,"isSigner":false,"docs":["The fleet `cargo_hold` cargo pod"]},{"name":"fuelTank","isMut":true,"isSigner":false,"docs":["The fleet `fuel_tank` cargo pod"]},{"name":"ammoBank","isMut":true,"isSigner":false,"docs":["The fleet `ammo_bank` cargo pod"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`]","Must provide at least one ship that is invalid for this instruction"]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"ForcedDisbandFleetInput"}}]},{"name":"forceDropFleetCargo","accounts":[{"name":"fleet","isMut":true,"isSigner":false,"docs":["The `Fleet` Account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The origin cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The `cargo_type` for the token"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token account"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[]},{"name":"idleToLoadingBay","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"idleToRespawn","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"atlasTokenFrom","isMut":true,"isSigner":false,"docs":["Source Token account for ATLAS, owned by the player"]},{"name":"atlasTokenTo","isMut":true,"isSigner":false,"docs":["Vault Token account for ATLAS"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The Solana Token Program"]}],"args":[{"name":"input","type":{"defined":"IdleToRespawnInput"}}]},{"name":"initGame","accounts":[{"name":"signer","isMut":true,"isSigner":true,"docs":["The entity calling this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The sector permissions [`Profile`]"]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new game"]},{"name":"gameId","isMut":true,"isSigner":true,"docs":["The [`Game`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[]},{"name":"initGameState","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new `GameState`"]},{"name":"gameState","isMut":true,"isSigner":false,"docs":["The [`GameState`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"InitGameStateInput"}}]},{"name":"invalidateRental","accounts":[{"name":"subProfileInvalidator","isMut":false,"isSigner":true,"docs":["This is a signer to help make sure the fleet wont be locked."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet to rent out."]}],"args":[]},{"name":"invalidateShip","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":true,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"ship","isMut":true,"isSigner":false,"docs":["The current [`Ship`] account"]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"loadingBayToIdle","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"mineAsteroidToRespawn","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]},{"name":"planet","isMut":true,"isSigner":false,"docs":["The [`Planet`] account"]},{"name":"fuelTank","isMut":false,"isSigner":false,"docs":["The fuel tank cargo pod"]},{"name":"fuelTokenFrom","isMut":false,"isSigner":false,"docs":["The source token account for fuel - owned by the `fuel_tank`"]},{"name":"atlasTokenFrom","isMut":true,"isSigner":false,"docs":["Source Token account for ATLAS, owned by the player"]},{"name":"atlasTokenTo","isMut":true,"isSigner":false,"docs":["Vault Token account for ATLAS"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The Solana Token Program"]}],"args":[{"name":"input","type":{"defined":"MineAsteroidToRespawnInput"}}]},{"name":"registerFleetsPointModifier","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for the cpi points instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The points permissions [`Profile`](player_profile::state::Profile)"]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder - pays for account rent"]},{"name":"pointsCategory","isMut":false,"isSigner":false,"docs":["The `PointCategory`"]},{"name":"pointsModifierAccount","isMut":true,"isSigner":false,"docs":["The `PointsModifier` account to be inited in Points CPI"]},{"name":"pointsProgram","isMut":false,"isSigner":false,"docs":["The points program"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]},{"name":"game","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterFleetsPointsModifierInput"}}]},{"name":"registerMineItem","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new mine item"]},{"name":"mineItem","isMut":true,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"mint","isMut":true,"isSigner":false,"docs":["The mint address representing the mine item"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterMineItemInput"}}]},{"name":"registerPlanet","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new game"]},{"name":"planet","isMut":true,"isSigner":true,"docs":["The [`Planet`] account"]},{"name":"sector","isMut":true,"isSigner":false,"docs":["The [`Sector`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterPlanetInput"}}]},{"name":"registerResource","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new resource"]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]},{"name":"location","isMut":true,"isSigner":false,"docs":["The Location address"]},{"name":"mineItem","isMut":true,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterResourceInput"}}]},{"name":"registerSagePlayerProfile","accounts":[{"name":"profile","isMut":false,"isSigner":false,"docs":["The player permissions [`Profile`]"]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new profile"]},{"name":"sagePlayerProfile","isMut":true,"isSigner":false,"docs":["The `SagePlayerProfile` account"]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[]},{"name":"registerSector","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new sector"]},{"name":"discoverer","isMut":false,"isSigner":false,"docs":["The discoverer of this sector"]},{"name":"sector","isMut":true,"isSigner":false,"docs":["The [`Sector`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"coordinates","type":{"array":["i64",2]}},{"name":"name","type":{"array":["u8",64]}},{"name":"keyIndex","type":"u16"}]},{"name":"registerShip","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new game"]},{"name":"ship","isMut":true,"isSigner":true,"docs":["The [`Ship`] account"]},{"name":"mint","isMut":false,"isSigner":false,"docs":["The mint address representing the [`Ship`]"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterShipInput"}}]},{"name":"registerStar","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder - pays for account rent"]},{"name":"star","isMut":true,"isSigner":true,"docs":["The [`Star`] account"]},{"name":"sector","isMut":true,"isSigner":false,"docs":["The [`Sector`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterStarInput"}}]},{"name":"registerStarbase","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new star base"]},{"name":"starbase","isMut":true,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"sector","isMut":false,"isSigner":false,"docs":["The [`Sector`] account"]},{"name":"gameStateAndProfile","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterStarbaseInputUnpacked"}}]},{"name":"registerStarbasePlayer","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder -- pays account rent"]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"sagePlayerProfile","isMut":false,"isSigner":false,"docs":["The [`SagePlayerProfile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the player belongs to."]},{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] account to initialize"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[]},{"name":"registerSurveyDataUnitTracker","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new mine item"]},{"name":"surveyDataUnitTracker","isMut":true,"isSigner":false,"docs":["The [`SurveyDataUnitTracker`] account"]},{"name":"mint","isMut":false,"isSigner":false,"docs":["The mint for the new `SurveyDataUnitTracker`"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RegisterSurveyDataUnitTrackerInput"}}]},{"name":"removeCargoPod","accounts":[{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The cargo pod (should be empty)"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"StarbaseRemoveCargoPodInput"}}]},{"name":"removeConnection","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["Where the rent refund funds from the connections go to."]},{"name":"sector1","isMut":true,"isSigner":false,"docs":["The first sector to remove from"]},{"name":"sector2","isMut":true,"isSigner":false,"docs":["The second sector to remove from"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"sector1Index","type":"u16"},{"name":"sector2Index","type":"u16"},{"name":"keyIndex","type":"u16"}]},{"name":"removeInvalidShipEscrow","accounts":[{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"sagePlayerProfile","isMut":true,"isSigner":false,"docs":["The [`SagePlayerProfile`] account"]},{"name":"destinationTokenAccount","isMut":true,"isSigner":false,"docs":["The Destination Token Account"]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`] Account"]},{"name":"shipEscrowTokenAccount","isMut":true,"isSigner":false,"docs":["The Escrow Token Account"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The Token Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RemoveShipEscrowInput"}}]},{"name":"removeShipEscrow","accounts":[{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"sagePlayerProfile","isMut":true,"isSigner":false,"docs":["The [`SagePlayerProfile`] account"]},{"name":"destinationTokenAccount","isMut":true,"isSigner":false,"docs":["The Destination Token Account"]},{"name":"ship","isMut":false,"isSigner":false,"docs":["The [`Ship`] Account"]},{"name":"shipEscrowTokenAccount","isMut":true,"isSigner":false,"docs":["The Escrow Token Account"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The Token Program"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"RemoveShipEscrowInput"}}]},{"name":"respawnToLoadingBay","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoHold","isMut":false,"isSigner":false,"docs":["The fleet `cargo_hold` cargo pod"]},{"name":"fuelTank","isMut":false,"isSigner":false,"docs":["The fleet `fuel_tank` cargo pod"]},{"name":"ammoBank","isMut":false,"isSigner":false,"docs":["The fleet `ammo_bank` cargo pod"]}],"args":[{"name":"input","type":{"defined":"RespawnToLoadingBayInput"}}]},{"name":"scanForSurveyDataUnits","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"surveyDataUnitTracker","isMut":true,"isSigner":false,"docs":["The [`SurveyDataUnitTracker`] account"]},{"name":"surveyDataUnitTrackerSigner","isMut":false,"isSigner":false,"docs":["The `SurveyDataUnitTracker` signer"]},{"name":"cargoHold","isMut":true,"isSigner":false,"docs":["The general cargo hold cargo pod for the fleet"]},{"name":"sduTokenFrom","isMut":true,"isSigner":false,"docs":["Source token account for the SDU, owned by `survey_data_unit_tracker_signer`"]},{"name":"sduTokenTo","isMut":true,"isSigner":false,"docs":["Destination token account for the SDU, owned by cargo_hold"]},{"name":"repairKitTokenFrom","isMut":true,"isSigner":false,"docs":["Token account for repair kit, owned by fleet"]},{"name":"repairKitMint","isMut":true,"isSigner":false,"docs":["The food token mint"]},{"name":"sduCargoType","isMut":false,"isSigner":false,"docs":["The cargo type of the SDU"]},{"name":"repairKitCargoType","isMut":false,"isSigner":false,"docs":["The cargo type of Repair Kits"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The cargo program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The token program"]},{"name":"instructionsSysvar","isMut":false,"isSigner":false,"docs":["Solana Instructions Sysvar"]},{"name":"recentSlothashes","isMut":false,"isSigner":false,"docs":["Solana recent slothashes"]}],"args":[{"name":"input","type":{"defined":"ScanForSurveyDataUnitsInput"}}]},{"name":"setNextShip","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"ship","isMut":true,"isSigner":false,"docs":["The current [`Ship`] account"]},{"name":"nextShip","isMut":true,"isSigner":false,"docs":["The next [`Ship`] account"]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"startCraftingProcess","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":false,"isSigner":false,"docs":["The [`CraftingInstance`] account"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The [`CraftingProcess`] account"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting [`Recipe`]"]},{"name":"craftingFacility","isMut":false,"isSigner":false,"docs":["The `CraftingFacility` account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]}],"args":[{"name":"input","type":{"defined":"StarbaseStartCraftingProcessInput"}}]},{"name":"startMiningAsteroid","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"mineItem","isMut":false,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]},{"name":"planet","isMut":true,"isSigner":false,"docs":["The [`Planet`] account"]}],"args":[{"name":"input","type":{"defined":"StartMiningAsteroidInput"}}]},{"name":"startSubwarp","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]}],"args":[{"name":"input","type":{"defined":"StartSubwarpInput"}}]},{"name":"stopMiningAsteroid","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]},{"name":"planet","isMut":true,"isSigner":false,"docs":["The [`Planet`] account"]},{"name":"fuelTank","isMut":true,"isSigner":false,"docs":["The fuel tank cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account for fuel"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `fuel_tank`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token account"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"StopMiningAsteroidInput"}}]},{"name":"stopSubwarp","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]}],"args":[{"name":"input","type":{"defined":"StopSubwarpInput"}}]},{"name":"syncResource","accounts":[{"name":"mineItem","isMut":false,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]}],"args":[]},{"name":"syncStarbasePlayer","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]}],"args":[]},{"name":"transferCargoAtStarbase","accounts":[{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoPodFrom","isMut":true,"isSigner":false,"docs":["The origin cargo pod"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod_from`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `cargo_pod_to`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"StarbaseTransferCargoInput"}}]},{"name":"transferCargoWithinFleet","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoPodFrom","isMut":true,"isSigner":false,"docs":["The origin cargo pod"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod_from`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `cargo_pod_to`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"TransferCargoWithinFleetInput"}}]},{"name":"updateGame","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":true,"isSigner":false,"docs":["The [`Game`] account"]}]}],"args":[{"name":"input","type":{"defined":"UpdateGameInput"}}]},{"name":"updateGameState","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":true,"isSigner":false,"docs":["The [`GameState`] account"]}],"args":[{"name":"input","type":{"defined":"UpdateGameStateInput"}}]},{"name":"updateMineItem","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"mineItem","isMut":true,"isSigner":false,"docs":["The [`MineItem`] account"]}],"args":[{"name":"input","type":{"defined":"UpdateMineItemInput"}}]},{"name":"updatePlanet","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"planet","isMut":true,"isSigner":false,"docs":["The [`Planet`] account"]}],"args":[{"name":"input","type":{"defined":"UpdatePlanetInput"}}]},{"name":"updateResource","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"mineItem","isMut":false,"isSigner":false,"docs":["The [`MineItem`] account"]},{"name":"resource","isMut":true,"isSigner":false,"docs":["The [`Resource`] account"]}],"args":[{"name":"input","type":{"defined":"UpdateResourceInput"}}]},{"name":"updateShip","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"ship","isMut":true,"isSigner":false,"docs":["The [`Ship`] account"]}],"args":[{"name":"input","type":{"defined":"UpdateShipInput"}}]},{"name":"updateShipEscrow","accounts":[{"name":"oldShip","isMut":false,"isSigner":false,"docs":["The old [`Ship`] Account"]},{"name":"next","isMut":false,"isSigner":false,"docs":["The address indicated as `next` in the `old_ship` account"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":true,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]}],"args":[{"name":"input","type":{"defined":"UpdateShipEscrowInput"}}]},{"name":"updateShipInFleet","accounts":[{"name":"fleet","isMut":true,"isSigner":false,"docs":["The [`Fleet`] account"]},{"name":"fleetShips","isMut":true,"isSigner":false,"docs":["The [`FleetShips`] account"]},{"name":"oldShip","isMut":false,"isSigner":false,"docs":["The old [`Ship`] Account"]},{"name":"next","isMut":false,"isSigner":false,"docs":["The address indicated as `next` in the `old_ship` account"]},{"name":"gameAccounts","accounts":[{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]}],"args":[{"name":"input","type":{"defined":"UpdateShipFleetInput"}}]},{"name":"updateStar","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"star","isMut":true,"isSigner":false,"docs":["The [`Star`] account"]}],"args":[{"name":"input","type":{"defined":"UpdateStarInput"}}]},{"name":"updateStarbase","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new game"]},{"name":"starbase","isMut":true,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The Solana System program"]}],"args":[{"name":"input","type":{"defined":"UpdateStarbaseInput"}}]},{"name":"updateSurveyDataUnitTracker","accounts":[{"name":"gameAndProfile","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"surveyDataUnitTracker","isMut":true,"isSigner":false,"docs":["The [`SurveyDataUnitTracker`] account"]}],"args":[{"name":"input","type":{"defined":"UpdateSurveyDataUnitTrackerInput"}}]},{"name":"warpLane","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"fromStarbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"toStarbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"fromSector","isMut":false,"isSigner":false,"docs":["The Sector account representing the fleet`s  current sector"]},{"name":"toSector","isMut":false,"isSigner":false,"docs":["The Sector account that `Fleet` will move to"]},{"name":"fuelTank","isMut":true,"isSigner":false,"docs":["The fuel tank cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The `Cargo Type` Account"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The `CargoStatsDefinition` for the cargo type"]},{"name":"fuelTokenFrom","isMut":true,"isSigner":false,"docs":["The fuel source token account - owned by the `fuel_tank`"]},{"name":"fuelMint","isMut":true,"isSigner":false,"docs":["Token Mint - The fuel mint"]},{"name":"feeTokenFrom","isMut":true,"isSigner":false,"docs":["The fee source token account"]},{"name":"feeTokenTo","isMut":true,"isSigner":false,"docs":["The fee destination token account"]},{"name":"feeMint","isMut":true,"isSigner":false,"docs":["Fee Token Mint"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"WarpLaneInput"}}]},{"name":"warpToCoordinate","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"fuelTank","isMut":true,"isSigner":false,"docs":["The fuel tank cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account for fuel"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `fuel_tank`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["Token Mint - The fuel mint"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"WarpToCoordinateInput"}}]},{"name":"withdrawCargoFromFleet","accounts":[{"name":"gameAccountsFleetAndOwner","accounts":[{"name":"gameFleetAndOwner","accounts":[{"name":"fleetAndOwner","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key on the profile."]},{"name":"owningProfile","isMut":false,"isSigner":false,"docs":["The profile that owns the fleet."]},{"name":"owningProfileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"fleet","isMut":true,"isSigner":false,"docs":["The fleet."]}]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"cargoPodFrom","isMut":true,"isSigner":false,"docs":["The origin cargo pod, owned by the fleet"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod, owned by the Starbase player"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod_from`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `cargo_pod_to`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"WithdrawCargoFromFleetInput"}}]},{"name":"withdrawCargoFromGame","accounts":[{"name":"fundsTo","isMut":true,"isSigner":false,"docs":["The funds_to - receives rent refund"]},{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The new cargo pod"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The cargo type account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source token account - owned by the `cargo_pod`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination token account - owned by the `key`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The mint of the token accounts"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"input","type":{"defined":"CargoToGameInput"}}]},{"name":"withdrawCraftingIngredient","accounts":[{"name":"starbaseAndStarbasePlayer","accounts":[{"name":"starbase","isMut":false,"isSigner":false,"docs":["The [`Starbase`] account"]},{"name":"starbasePlayer","isMut":false,"isSigner":false,"docs":["The [`StarbasePlayer`] Account"]}]},{"name":"craftingInstance","isMut":false,"isSigner":false,"docs":["The [`CraftingInstance`] account"]},{"name":"craftingFacility","isMut":false,"isSigner":false,"docs":["The [`CraftingFacility`](crafting::CraftingFacility) account"]},{"name":"craftingProcess","isMut":true,"isSigner":false,"docs":["The crafting process account"]},{"name":"cargoPodTo","isMut":true,"isSigner":false,"docs":["The destination cargo pod account"]},{"name":"craftingRecipe","isMut":false,"isSigner":false,"docs":["The crafting recipe"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"cargoStatsDefinition","isMut":false,"isSigner":false,"docs":["The cargo stats definition account"]},{"name":"gameAccountsAndProfile","accounts":[{"name":"gameAndProfileAndFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The [`Profile`] account"]},{"name":"profileFaction","isMut":false,"isSigner":false,"docs":["The faction that the profile belongs to."]},{"name":"gameId","isMut":false,"isSigner":false,"docs":["The [`Game`] account"]}]},{"name":"gameState","isMut":false,"isSigner":false,"docs":["The [`GameState`] account"]}]},{"name":"tokenFrom","isMut":true,"isSigner":false,"docs":["The source account of the tokens - owner should be `crafting_process`"]},{"name":"tokenTo","isMut":true,"isSigner":false,"docs":["The destination account of the tokens - owner should be `cargo_pod_to`"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The token mint"]},{"name":"craftingProgram","isMut":false,"isSigner":false,"docs":["The Crafting Program"]},{"name":"cargoProgram","isMut":false,"isSigner":false,"docs":["The Cargo Program"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The [Token] program"]}],"args":[{"name":"input","type":{"defined":"StarbaseWithdrawCraftingIngredientInput"}}]}],"accounts":[{"name":"CraftingInstance","docs":["This account is used to store relevant information for a crafting process instance"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account"],"type":"u8"},{"name":"seqId","docs":["The sequence id for the `Starbase`"],"type":"u16"},{"name":"numCrew","docs":["The number of crew taking part in the crafting process"],"type":"u64"},{"name":"starbasePlayer","docs":["The `StarbasePlayer` account address"],"type":"publicKey"},{"name":"craftingProcess","docs":["The `CraftingProcess` account address"],"type":"publicKey"},{"name":"bump","docs":["Bump of Account PDA"],"type":"u8"}]}},{"name":"DisbandedFleet","docs":["Keeps track of a fleet while it is disbanded"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["The game id this belongs to."],"type":"publicKey"},{"name":"ownerProfile","docs":["The owners profile."],"type":"publicKey"},{"name":"starbase","docs":["The `Starbase` at which the original `Fleet` was disbanded."],"type":"publicKey"},{"name":"fleetLabel","docs":["The label or name of the disbanded fleet."],"type":{"array":["u8",32]}},{"name":"fleetShips","docs":["The `FleetShips` account belonging to the original `Fleet` that was disbanded."],"type":"publicKey"},{"name":"bump","docs":["The disbanded fleets bump."],"type":"u8"}]}},{"name":"Fleet","docs":["A `SAGE` fleet."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["The game id this belongs to."],"type":"publicKey"},{"name":"ownerProfile","docs":["The owners profile."],"type":"publicKey"},{"name":"fleetShips","docs":["Fleet Ships Key"],"type":"publicKey"},{"name":"subProfile","docs":["The fleets sub-authority.","If [`Some`] will have the exclusive ability to interact with this fleet."],"type":{"defined":"OptionalNonSystemPubkey"}},{"name":"subProfileInvalidator","docs":["The authority for revoking a sun-authority."],"type":"publicKey"},{"name":"fleetLabel","docs":["The label or name of the fleet."],"type":{"array":["u8",32]}},{"name":"shipCounts","docs":["The number of ships in the fleet."],"type":{"defined":"ShipCounts"}},{"name":"warpCooldownExpiresAt","docs":["The time at which the warp cooldown expires"],"type":"i64"},{"name":"scanCooldownExpiresAt","docs":["The time at which the scan cooldown expires"],"type":"i64"},{"name":"stats","docs":["The fleets stats."],"type":{"defined":"ShipStats"}},{"name":"cargoHold","docs":["The Cargo pod representing the fleets cargo hold"],"type":"publicKey"},{"name":"fuelTank","docs":["The Cargo pod representing the fleets fuel tank"],"type":"publicKey"},{"name":"ammoBank","docs":["The Cargo pod representing the fleets ammo bank"],"type":"publicKey"},{"name":"updateId","docs":["The update id for the `Fleet`"],"type":"u64"},{"name":"bump","docs":["The fleets bump."],"type":"u8"}]}},{"name":"FleetShips","docs":["Keeps track of a the individual ships that make up a fleet"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"fleet","docs":["The `Fleet` account this belongs to"],"type":"publicKey"},{"name":"fleetShipsInfoCount","docs":["List length of `RemainingData`"],"type":"u32"},{"name":"bump","docs":["The disbanded fleets bump."],"type":"u8"}]}},{"name":"Game","docs":["Global Game Configuration variables"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"updateId","docs":["The sequence id for updates."],"type":"u64"},{"name":"profile","docs":["The [`Profile`](player_profile::state::Profile) that handles the sector program permissions"],"type":"publicKey"},{"name":"gameState","docs":["The associated `GameState` account."],"type":"publicKey"},{"name":"points","docs":["Points setting"],"type":{"defined":"Points"}},{"name":"cargo","docs":["Cargo settings"],"type":{"defined":"Cargo"}},{"name":"crafting","docs":["Crafting settings"],"type":{"defined":"Crafting"}},{"name":"mints","docs":["mint related settings"],"type":{"defined":"Mints"}},{"name":"vaults","docs":["vault related settings"],"type":{"defined":"Vaults"}},{"name":"riskZones","docs":["Data for risk zones"],"type":{"defined":"RiskZonesData"}}]}},{"name":"GameState","docs":["Keeps track of variables that may change frequently during a `Game` session"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account"],"type":"u8"},{"name":"updateId","docs":["The sequence id for updates"],"type":"u64"},{"name":"gameId","docs":["The `Game` that this belongs to"],"type":"publicKey"},{"name":"fleet","docs":["Fleet settings"],"type":{"defined":"FleetInfo"}},{"name":"levers","docs":["Global levers"],"type":{"defined":"Levers"}},{"name":"misc","docs":["Miscellaneous settings"],"type":{"defined":"MiscVariables"}},{"name":"bump","docs":["PDA bump"],"type":"u8"}]}},{"name":"MineItem","docs":["Represents a token registered as an item that can be mined"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["the game_id account this item is registered with"],"type":"publicKey"},{"name":"name","docs":["The name of the `MineItem`"],"type":{"array":["u8",64]}},{"name":"mint","docs":["the mint representing the items mined"],"type":"publicKey"},{"name":"mineItemUpdateId","docs":["The `MineItem` update id"],"type":"u64"},{"name":"resourceHardness","docs":["How hard it is to mine this item -> Ranges from 1-10"],"type":"u16"},{"name":"numResourceAccounts","docs":["The number of resource accounts for this mine item"],"type":"u64"},{"name":"bump","docs":["bump for PDA"],"type":"u8"}]}},{"name":"Planet","docs":["Planet"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"name","docs":["The name of this `Planet`"],"type":{"array":["u8",64]}},{"name":"gameId","docs":["the `Game` that this belongs to"],"type":"publicKey"},{"name":"sector","docs":["the sector that this belongs to"],"type":{"array":["i64",2]}},{"name":"subCoordinates","docs":["sub_coordinates as [x, y]"],"type":{"array":["i64",2]}},{"name":"planetType","docs":["the planet type"],"type":"u8"},{"name":"position","docs":["the planet position"],"type":"u8"},{"name":"size","docs":["size"],"type":"u64"},{"name":"maxHp","docs":["maximum health"],"type":"u64"},{"name":"currentHealth","docs":["The current health of the `Planet`."],"type":"u64"},{"name":"amountMined","docs":["the cumulative amount mined from this `Asteroid`"],"type":"u64"},{"name":"numResources","docs":["the number of resources at this `Asteroid`"],"type":"u8"},{"name":"numMiners","docs":["the number of entities currently mining at this `Asteroid`"],"type":"u64"}]}},{"name":"Resource","docs":["Represents a mine-able item existing at a particular location (e.g. a planet)"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["the game_id pubkey"],"type":"publicKey"},{"name":"location","docs":["the locations pubkey"],"type":"publicKey"},{"name":"mineItem","docs":["the mine item pubkey"],"type":"publicKey"},{"name":"locationType","docs":["the location type"],"type":"u8"},{"name":"systemRichness","docs":["How abundant the resource is at the location -> Ranges from 1-5"],"type":"u16"},{"name":"amountMined","docs":["the cumulative amount mined from this resource"],"type":"u64"},{"name":"numMiners","docs":["the number of entities currently mining this resource"],"type":"u64"},{"name":"mineItemUpdateId","docs":["The `MineItem` update id"],"type":"u64"},{"name":"resourceUpdateId","docs":["The `Resource` update id"],"type":"u64"},{"name":"bump","docs":["bump for PDA"],"type":"u8"}]}},{"name":"SagePlayerProfile","docs":["A `SAGE` players profile."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account"],"type":"u8"},{"name":"playerProfile","docs":["The `Profile` key"],"type":"publicKey"},{"name":"gameId","docs":["The id of the `Game`"],"type":"publicKey"},{"name":"bump","docs":["Bump of Account PDA"],"type":"u8"}]}},{"name":"Sector","docs":["Sector"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["the game_id that this belongs to"],"type":"publicKey"},{"name":"coordinates","docs":["coordinates as [x, y]"],"type":{"array":["i64",2]}},{"name":"discoverer","docs":["The discoverer of this sector"],"type":"publicKey"},{"name":"name","docs":["The name of this sector"],"type":{"array":["u8",64]}},{"name":"numStars","docs":["the number of stars in this system"],"type":"u16"},{"name":"numPlanets","docs":["the number of planets in this system"],"type":"u16"},{"name":"numMoons","docs":["the number of moons in this system"],"type":"u16"},{"name":"numAsteroidBelts","docs":["the number of num_asteroid belts in this system"],"type":"u16"},{"name":"numConnections","docs":["the number of connections in this system"],"type":"u16"},{"name":"bump","docs":["PDA bump"],"type":"u8"}]}},{"name":"Ship","docs":["This account represents a Ship"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["the game_id account this Ship is registered with"],"type":"publicKey"},{"name":"mint","docs":["the mint representing the Ship"],"type":"publicKey"},{"name":"name","docs":["The name of this `Ship`"],"type":{"array":["u8",64]}},{"name":"sizeClass","docs":["the ships size class"],"type":"u8"},{"name":"stats","docs":["The ships stats"],"type":{"defined":"ShipStats"}},{"name":"updateId","docs":["The `update_id` for the `Ship`"],"type":"u64"},{"name":"maxUpdateId","docs":["The max `Game` `update_id` that the `Ship` is valid for"],"type":"u64"},{"name":"next","docs":["the next `Ship` account to use when this `Ship` is updated"],"type":{"defined":"OptionalNonSystemPubkey"}}]}},{"name":"Star","docs":["`Star` account"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"name","docs":["The name of this `Star`"],"type":{"array":["u8",64]}},{"name":"gameId","docs":["the game_id that this belongs to"],"type":"publicKey"},{"name":"sector","docs":["the sector that this belongs to"],"type":{"array":["i64",2]}},{"name":"size","docs":["size"],"type":"u64"},{"name":"subCoordinates","docs":["sub_coordinates as [x, y]"],"type":{"array":["i64",2]}},{"name":"starType","docs":["the star type"],"type":"u8"}]}},{"name":"Starbase","docs":["Starbase"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this `Starbase` account."],"type":"u8"},{"name":"gameId","docs":["the game_id that this `Starbase` belongs to"],"type":"publicKey"},{"name":"sector","docs":["the sector that this `Starbase` belongs to"],"type":{"array":["i64",2]}},{"name":"craftingFacility","docs":["the [`CraftingFacility`] to use for crafting at this `Starbase`"],"type":"publicKey"},{"name":"name","docs":["The name of this `Starbase`"],"type":{"array":["u8",64]}},{"name":"subCoordinates","docs":["coordinates as [x, y]"],"type":{"array":["i64",2]}},{"name":"faction","docs":["The faction of the `Starbase`."],"type":"u8"},{"name":"bump","docs":["bump for PDA"],"type":"u8"},{"name":"seqId","docs":["The sequence id for the `Starbase`"],"type":"u16"},{"name":"state","docs":["The state of the `Starbase`. Is a [`StarbaseState`]."],"type":"u8"},{"name":"level","docs":["The level of the `Starbase`."],"type":"u8"},{"name":"hp","docs":["The `Starbase` health points."],"type":"u64"},{"name":"sp","docs":["The `Starbase` shield points."],"type":"u64"},{"name":"sectorRingAvailable","docs":["The planet position (`sector::state::Ring`) available for this `Starbase`"],"type":"u8"},{"name":"upgradeState","docs":["The `Starbase` upgrade state using `StarbaseUpgradeLevelState`"],"type":"i64"},{"name":"builtDestroyedTimestamp","docs":["The last time the starbase was built or destroyed"],"type":"i64"},{"name":"numUpgradingFleets","docs":["The number of fleets currently upgrading the `Starbase`"],"type":"u64"},{"name":"totalUpgradeRate","docs":["The total rate at which the SB is currently upgrading"],"type":"u64"},{"name":"receivedUpgradeMaterials","docs":["The total received amount of material for upgrading the `Starbase` until the `last_updated_rate_timestamp`"],"type":"u64"},{"name":"requiredUpgradeMaterials","docs":["The total required amount of material for upgrading the `Starbase`"],"type":"u64"},{"name":"lastUpdatedRateTimestamp","docs":["The last time the SB total upgrade rate was updated"],"type":"i64"}]}},{"name":"StarbasePlayer","docs":["The `SAGE` player info within a `Starbase`"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account"],"type":"u8"},{"name":"playerProfile","docs":["The `Profile` key"],"type":"publicKey"},{"name":"gameId","docs":["The id of the `Game`"],"type":"publicKey"},{"name":"starbase","docs":["The `Starbase` key"],"type":"publicKey"},{"name":"sagePlayerProfile","docs":["The `SagePlayerProfile` key"],"type":"publicKey"},{"name":"bump","docs":["Bump of Account PDA"],"type":"u8"},{"name":"shipEscrowCount","docs":["List length of `RemainingData`"],"type":"u32"},{"name":"totalCrew","docs":["The total crew members from the players fleets at the `Starbase`"],"type":"u64"},{"name":"busyCrew","docs":["The number of crew members that is engaged/busy and not available"],"type":"u64"},{"name":"updateId","docs":["The `Game` update id"],"type":"u64"},{"name":"updatedShipEscrowCount","docs":["Number of updated items in `RemainingData` list","This will be `ship_escrow_count` when all ships in escrow are up-to-date"],"type":"u32"}]}},{"name":"SurveyDataUnitTracker","docs":["Survey Data Unit (SDU) Tracker"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"gameId","docs":["The game_id that this belongs to"],"type":"publicKey"},{"name":"mint","docs":["The Survey Data Unit Mint"],"type":"publicKey"},{"name":"signer","docs":["The signer for this account"],"type":"publicKey"},{"name":"signerBump","docs":["The signer for this account"],"type":"u8"},{"name":"surveyDataUnitBySecond","docs":["Survey Data Units found in the last `MAX_SECONDS` seconds","This is structured such that the 0th index represents SDUs found `MAX_SECONDS` seconds ago,","and the last index represents SDUs found in the most recent second","NB: the only reason why this is `[u32; MAX_SECONDS]` and not `[u16; MAX_SECONDS]` is to prevent overflows"],"type":{"array":["u32",60]}},{"name":"limit","docs":["The global limit on how many SDUs can be found in a `MAX_SECONDS` second period"],"type":"u32"},{"name":"scanCooldown","docs":["The amount of time that must go by before someone can scan a sector again"],"type":"u16"},{"name":"probability","docs":["The chance that a player gets an SDU on a legitimate scan, this is meant to be a percentage","10,000 == 100%, 100 = 1%, etc."],"type":"u16"},{"name":"max","docs":["The max number of SDUs that can be found while scanning"],"type":"u16"},{"name":"numSectors","docs":["The number of Sectors that can be scanned"],"type":"u16"},{"name":"lastUpdate","docs":["The last time the `SurveyDataUnitTracker` was updated"],"type":"i64"}]}}],"types":[{"name":"AddShipEscrowInput","docs":["Struct for data input for `AddShipEscrow`"],"type":{"kind":"struct","fields":[{"name":"shipAmount","docs":["Amount of `Ship` tokens to transfer to escrow"],"type":"u64"},{"name":"index","docs":["Index of `WrappedShipEscrow` in remaining data of `StarbasePlayer`","Some index `WrappedShipEscrow`, or None for new `WrappedShipEscrow`"],"type":{"option":"u32"}}]}},{"name":"AddShipToFleetInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"shipAmount","docs":["Number of ships to add to the fleet"],"type":"u8"},{"name":"shipEscrowIndex","docs":["Index of `WrappedShipEscrow` in remaining data of `StarbasePlayer`"],"type":"u32"},{"name":"fleetShipInfoIndex","docs":["Index of `FleetShipsInfo` in remaining data of `FleetShips`"],"type":{"option":"u32"}},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"BaseEmissionsBySizeUtil","docs":["Type containing derived sub-levers used in `calculate_base_emissions()` discriminated by ship size"],"type":{"kind":"struct","fields":[{"name":"xxSmall","docs":["xx_small"],"type":"u64"},{"name":"xSmall","docs":["x_small"],"type":"u64"},{"name":"small","docs":["small"],"type":"u64"},{"name":"medium","docs":["medium"],"type":"u64"},{"name":"large","docs":["large"],"type":"u64"},{"name":"capital","docs":["capital"],"type":"u64"},{"name":"commander","docs":["commander"],"type":"u64"},{"name":"titan","docs":["titan"],"type":"u64"}]}},{"name":"BaseEmissionsBySizeUtilInput","docs":["Struct for data input to Update `base_emissions_by_size_util`"],"type":{"kind":"struct","fields":[{"name":"xxSmall","docs":["xx_small"],"type":"u64"},{"name":"xSmall","docs":["x_small"],"type":"u64"},{"name":"small","docs":["small"],"type":"u64"},{"name":"medium","docs":["medium"],"type":"u64"},{"name":"large","docs":["large"],"type":"u64"},{"name":"capital","docs":["capital"],"type":"u64"},{"name":"commander","docs":["commander"],"type":"u64"},{"name":"titan","docs":["titan"],"type":"u64"}]}},{"name":"Cargo","docs":["Variables for the Cargo program"],"type":{"kind":"struct","fields":[{"name":"statsDefinition","docs":["The cargo stats definition account"],"type":"publicKey"}]}},{"name":"CargoStats","docs":["A ships cargo stats"],"type":{"kind":"struct","fields":[{"name":"cargoCapacity","docs":["the capacity of the ships cargo hold"],"type":"u32"},{"name":"fuelCapacity","docs":["the capacity of the ships fuel tank"],"type":"u32"},{"name":"ammoCapacity","docs":["the capacity of the ships ammo bank"],"type":"u32"},{"name":"ammoConsumptionRate","docs":["the amount of ammo consumed per second by the ship when doing non-combat activities e.g. mining"],"type":"u32"},{"name":"foodConsumptionRate","docs":["the amount of food consumed per second by the ship when doing non-combat activities e.g. mining"],"type":"u32"},{"name":"miningRate","docs":["the amount of resources that can be mined by a ship per second"],"type":"u32"},{"name":"upgradeRate","docs":["the amount of upgrade material that is consumed by a ship per second while upgrading a Starbase"],"type":"u32"}]}},{"name":"CargoStatsUnpacked","docs":["Unpacked version of [`CargoStats`]"],"type":{"kind":"struct","fields":[{"name":"cargoCapacity","docs":["the capacity of the ships cargo hold"],"type":"u32"},{"name":"fuelCapacity","docs":["the capacity of the ships fuel tank"],"type":"u32"},{"name":"ammoCapacity","docs":["the capacity of the ships ammo bank"],"type":"u32"},{"name":"ammoConsumptionRate","docs":["the amount of ammo consumed per second by the ship when doing non-combat activities e.g. mining"],"type":"u32"},{"name":"foodConsumptionRate","docs":["the amount of food consumed per second by the ship when doing non-combat activities e.g. mining"],"type":"u32"},{"name":"miningRate","docs":["the amount of resources that can be mined by a ship per second"],"type":"u32"},{"name":"upgradeRate","docs":["the amount of upgrade material that is consumed by a ship per second while upgrading a Starbase"],"type":"u32"}]}},{"name":"CargoToGameInput","docs":["Struct for data input to `DepositCargoToGame`"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["cargo amount"],"type":"u64"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"CloseDisbandedFleetInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"Crafting","docs":["Variables for the Crafting program"],"type":{"kind":"struct","fields":[{"name":"domain","docs":["The crafting domain account"],"type":"publicKey"}]}},{"name":"CreateFleetInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"shipAmount","docs":["Number of ships to add to the fleet"],"type":"u8"},{"name":"fleetLabel","docs":["the fleet label"],"type":{"array":["u8",32]}},{"name":"shipEscrowIndex","docs":["Index of `WrappedShipEscrow` in remaining data of `StarbasePlayer`"],"type":"u32"},{"name":"cargoHoldSeeds","docs":["cargo hold seeds"],"type":{"array":["u8",32]}},{"name":"fuelTankSeeds","docs":["fuel tank seeds"],"type":{"array":["u8",32]}},{"name":"ammoBankSeeds","docs":["ammo bank seeds"],"type":{"array":["u8",32]}},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"DepositCargoToFleetInput","docs":["Struct for data input to `DepositCargoToFleet`"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["cargo amount"],"type":"u64"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"DeregisterSurveyDataUnitTrackerInput","docs":["Struct for data input that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"DisbandFleetInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"DisbandedFleetToEscrowInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"shipAmount","docs":["Number of ships to add to the fleet"],"type":"u16"},{"name":"shipEscrowIndex","docs":["Index of `WrappedShipEscrow` in remaining data of `StarbasePlayer`"],"type":{"option":"u32"}},{"name":"fleetShipInfoIndex","docs":["Index of `FleetShipsInfo` in remaining data of `FleetShips`"],"type":"u32"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"FactionsStarbaseLevelInfo","docs":["`Starbase` levels discriminated by faction"],"type":{"kind":"struct","fields":[{"name":"mud","docs":["Mud Starbase Levels Info"],"type":{"array":[{"defined":"StarbaseLevelInfo"},7]}},{"name":"oni","docs":["Oni Starbase Levels Info"],"type":{"array":[{"defined":"StarbaseLevelInfo"},7]}},{"name":"ustur","docs":["Ustur Starbase Levels Info"],"type":{"array":[{"defined":"StarbaseLevelInfo"},7]}}]}},{"name":"FleetInfo","docs":["Variables for the Fleet program"],"type":{"kind":"struct","fields":[{"name":"starbaseLevels","docs":["`Starbase` levels discriminated by faction"],"type":{"defined":"FactionsStarbaseLevelInfo"}},{"name":"fleetsLpModifier","docs":["The fleets account registered as a modifier for LP in the Points program"],"type":{"defined":"FleetsPointModifier"}},{"name":"fleetsXpModifier","docs":["The fleets account registered as a modifier for XP in the Points program"],"type":{"defined":"FleetsPointModifier"}},{"name":"maxFleetSize","docs":["Maximum `Fleet` size allowed"],"type":"u32"}]}},{"name":"FleetInput","docs":["Struct for data input to Update fleet settings"],"type":{"kind":"struct","fields":[{"name":"starbaseLevelInfoArray","docs":["`Starbase` Level Info array"],"type":{"option":{"vec":{"defined":"StarbaseLevelInfoArrayInput"}}}},{"name":"maxFleetSize","docs":["Maximum `Fleet` size allowed"],"type":{"option":"u32"}},{"name":"fleetsLpModifierBump","docs":["The bump for the `FleetsLPModifier` account"],"type":{"option":"u8"}},{"name":"fleetsXpModifierBump","docs":["The bump for the `FleetsXPModifier` account"],"type":{"option":"u8"}}]}},{"name":"FleetShipsInfo","docs":["Struct that represents info on a single ship type in a fleet"],"type":{"kind":"struct","fields":[{"name":"ship","docs":["The `Ship` account address"],"type":"publicKey"},{"name":"amount","docs":["The `Ship` token amount in escrow"],"type":"u64"},{"name":"updateId","docs":["The update id for the `Ship`"],"type":"u64"}]}},{"name":"FleetStarbaseUpgradeState","docs":["The upgrade start state for a fleet"],"type":{"kind":"enum","variants":[{"name":"NotFullyFilled"},{"name":"Started"},{"name":"Burning"}]}},{"name":"FleetsPointModifier","docs":["The fleets account registered as a modifier in the Points program"],"type":{"kind":"struct","fields":[{"name":"pubkey","docs":["`FleetsPointModifier` Pubkey"],"type":"publicKey"},{"name":"bump","docs":["`FleetsPointModifier` bump"],"type":"u8"}]}},{"name":"ForcedDisbandFleetInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"fleetShipInfoIndex","docs":["Index of `FleetShipsInfo` in remaining data of `FleetShips`"],"type":"u32"}]}},{"name":"Idle","docs":["The data for the [`FleetStateData::Idle`](crate::state_machine::FleetStateData::Idle) state"],"type":{"kind":"struct","fields":[{"name":"sector","docs":["The star system the fleet is in"],"type":{"array":["i64",2]}}]}},{"name":"IdleToRespawnInput","docs":["Struct for data input to initialize an `IdleToRespawn` Ix"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["index of the key in the player profile"],"type":"u16"}]}},{"name":"InitGameStateInput","docs":["Struct for data input to `InitGameState`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"KeyIndexInput","docs":["Struct for data input that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"Levers","docs":["Global levers"],"type":{"kind":"struct","fields":[{"name":"l0ResourcesScalarMultiplication","docs":["global lever that scales the quantity of resources. Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"l1EmissionsMainBreaker","docs":["global lever which impacts the distribution of effective emissions. Units are 10000ths. Valid output values >= 0."],"type":"u64"},{"name":"l2SystemRichnessEmissions","docs":["global lever which impacts the effect that system richness has on resource emissions. Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"l3ShipSizeWeight","docs":["global lever which impacts the effect that ship size has on resource emissions. Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"l4ResourceHardness","docs":["global lever which impacts the effect that resource hardness has on resource emissions. Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"l5FuelWarpBreaker","docs":["Module wide lever that directly impacts the nominal cost of warping. Units are 10000ths. Valid output values > 1."],"type":"u64"},{"name":"l6FuelPlanetBreaker","docs":["Module wide lever that directly impacts the nominal cost of planet exit. Units are 10000ths. Valid output values > 1."],"type":"u64"},{"name":"l7FuelRefinementEfficiency","docs":["Module wide lever that impacts refinement from R20 (hydrogen) to R4 (fuel). Units are 10000ths. Valid output values > 1."],"type":"u64"},{"name":"l8MiningFoodBreaker","docs":["Module wide lever that directly impacts the nominal cost of mining. Units are 10000ths. Valid output values between 0 and 1."],"type":"u64"},{"name":"l10FoodRefinementEfficiency","docs":["Module wide lever that impacts refinement from R20 (organics) to R4 (food). Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"l11OrganicsScalarMultiplication","docs":["Module specific lever that scales the quantity of organics in the economy."],"type":"u64"},{"name":"l16FuelCombatBreaker","docs":["Module wide lever that directly impacts the nominal cost of combat. Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"l21FuelSubwarpBreaker","docs":["Module wide lever that directly impacts the nominal cost of subwarp mvmt. Units are 10000ths. Valid output values > 0."],"type":"u64"},{"name":"baseEmissionsBySizeUtil","docs":["Set of derived sub-levers used in `calculate_base_emissions()`.","Math formula: `l1_emissions_main_breaker.powf(l3_ship_size_weight * ship_size)`"],"type":{"defined":"BaseEmissionsBySizeUtil"}}]}},{"name":"LeversInput","docs":["Struct for data input to Update levers"],"type":{"kind":"struct","fields":[{"name":"l0ResourcesScalarMultiplication","docs":["global lever that scales the quantity of resources."],"type":{"option":"u64"}},{"name":"l1EmissionsMainBreaker","docs":["global lever which impacts the distribution of effective emissions."],"type":{"option":"u64"}},{"name":"l2SystemRichnessEmissions","docs":["global lever which impacts the effect that system richness has on resource emissions."],"type":{"option":"u64"}},{"name":"l3ShipSizeWeight","docs":["global lever which impacts the effect that ship size has on resource emissions."],"type":{"option":"u64"}},{"name":"l4ResourceHardness","docs":["global lever which impacts the effect that resource hardness has on resource emissions."],"type":{"option":"u64"}},{"name":"l5FuelWarpBreaker","docs":["Module wide lever that directly impacts the nominal cost of warping"],"type":{"option":"u64"}},{"name":"l6FuelPlanetBreaker","docs":["Module wide lever that directly impacts the nominal cost of planet exit"],"type":{"option":"u64"}},{"name":"l7FuelRefinementEfficiency","docs":["Module wide lever that impacts refinement from R20 (hydrogen) to R4 (fuel)"],"type":{"option":"u64"}},{"name":"l8MiningFoodBreaker","docs":["Module wide lever that directly impacts the nominal cost of mining.  (Value between 0 and 1)"],"type":{"option":"u64"}},{"name":"l10FoodRefinementEfficiency","docs":["Module wide lever that impacts refinement from R20 (organics) to R4 (food)"],"type":{"option":"u64"}},{"name":"l11OrganicsScalarMultiplication","docs":["Module specific lever that scales the quantity of organics in the economy."],"type":{"option":"u64"}},{"name":"l16FuelCombatBreaker","docs":["Module wide lever that directly impacts the nominal cost of combat. Units are 10000ths. Valid output values > 0."],"type":{"option":"u64"}},{"name":"l21FuelSubwarpBreaker","docs":["Module wide lever that directly impacts the nominal cost of subwarp mvmt. Units are 10000ths. Valid output values > 0."],"type":{"option":"u64"}}]}},{"name":"LocationType","docs":["Represents different types of locations that a `Resource` might be found"],"type":{"kind":"enum","variants":[{"name":"Planet"}]}},{"name":"ManageGameInput","docs":["Struct for data input to managing Game accounts"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"MineAsteroid","docs":["The data for the [`FleetStateData::MineAsteroid`](crate::state_machine::FleetStateData::MineAsteroid) state"],"type":{"kind":"struct","fields":[{"name":"asteroid","docs":["The `Asteroid` the `Fleet` is mining (Must be an asteroid belt)"],"type":"publicKey"},{"name":"resource","docs":["The `Resource` being mined on the `Asteroid`"],"type":"publicKey"},{"name":"start","docs":["The timestamp at which mining activity started"],"type":"i64"},{"name":"end","docs":["The timestamp at which mining activity stops"],"type":"i64"},{"name":"lastUpdate","docs":["The last time the `Fleet` was updated"],"type":"i64"}]}},{"name":"MineAsteroidToRespawnInput","docs":["Struct for data input for `MineAsteroidToRespawnInput`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"Mints","docs":["Token mints"],"type":{"kind":"struct","fields":[{"name":"atlas","docs":["ATLAS token mint"],"type":"publicKey"},{"name":"polis","docs":["POLIS token mint"],"type":"publicKey"},{"name":"ammo","docs":["ammunition"],"type":"publicKey"},{"name":"food","docs":["food"],"type":"publicKey"},{"name":"fuel","docs":["fuel"],"type":"publicKey"},{"name":"repairKit","docs":["repair kit"],"type":"publicKey"}]}},{"name":"MiscStats","docs":["A ships miscellaneous stats"],"type":{"kind":"struct","fields":[{"name":"crew","docs":["Number of crew in the ship"],"type":"u64"},{"name":"respawnTime","docs":["the time it takes the ship to respawn"],"type":"u16"},{"name":"scanCoolDown","docs":["the time it takes the ship to be able to scan again after scanning"],"type":"u16"},{"name":"scanRepairKitAmount","docs":["the amount of food required to do a scan"],"type":"u32"}]}},{"name":"MiscStatsUnpacked","docs":["Unpacked version of [`MiscStats`]"],"type":{"kind":"struct","fields":[{"name":"crew","docs":["Number of crew in the ship"],"type":"u64"},{"name":"respawnTime","docs":["the time it takes the ship to respawn"],"type":"u16"},{"name":"scanCoolDown","docs":["the time it takes the ship to be able to scan again after scanning"],"type":"u16"},{"name":"scanRepairKitAmount","docs":["the amount of food required to do a scan"],"type":"u32"}]}},{"name":"MiscVariables","docs":["Miscellaneous game state variables"],"type":{"kind":"struct","fields":[{"name":"warpLaneFuelCostReduction","docs":["Percentage by which the warp lane movement type reduces warp fuel cost"],"type":"i32"},{"name":"respawnFee","docs":["Respawn fee; You cannot enter into the respawning state without paying this fee","Since ATLAS has 8 decimal places, units are in the smallest value of ATLAS possible."],"type":"u64"}]}},{"name":"MiscVariablesInput","docs":["Struct for data input to update miscellaneous settings"],"type":{"kind":"struct","fields":[{"name":"warpLaneFuelCostReduction","docs":["Percentage by which the warp lane movement type reduces warp fuel cost"],"type":{"option":"i32"}},{"name":"respawnFee","docs":["Respawn fee, charged in ATLAS"],"type":{"option":"u64"}}]}},{"name":"MoveSubwarp","docs":["The data for the [`FleetStateData::MoveSubwarp`] state"],"type":{"kind":"struct","fields":[{"name":"fromSector","docs":["The sector the fleet is coming from"],"type":{"array":["i64",2]}},{"name":"toSector","docs":["The sector the fleet is going to"],"type":{"array":["i64",2]}},{"name":"currentSector","docs":["The sector the fleet is currently in"],"type":{"array":["i64",2]}},{"name":"departureTime","docs":["When the fleet started subwarp"],"type":"i64"},{"name":"arrivalTime","docs":["When the fleet will finish subwarp"],"type":"i64"},{"name":"fuelExpenditure","docs":["The fuel cost of the subwarp"],"type":"u64"},{"name":"lastUpdate","docs":["The last update time"],"type":"i64"}]}},{"name":"MoveWarp","docs":["The data for the [`FleetStateData::MoveWarp`] state"],"type":{"kind":"struct","fields":[{"name":"fromSector","docs":["The star system the fleet is coming from"],"type":{"array":["i64",2]}},{"name":"toSector","docs":["The star system the fleet is going to"],"type":{"array":["i64",2]}},{"name":"warpStart","docs":["When the fleet started warping"],"type":"i64"},{"name":"warpFinish","docs":["When the warp will end"],"type":"i64"}]}},{"name":"MovementStats","docs":["A ships movement stats"],"type":{"kind":"struct","fields":[{"name":"subwarpSpeed","docs":["the amount of distance that the ship can cover in one second while sub-warping"],"type":"u32"},{"name":"warpSpeed","docs":["the amount of distance that the ship can cover in one second while warping"],"type":"u32"},{"name":"maxWarpDistance","docs":["the max distance that the ship can warp"],"type":"u16"},{"name":"warpCoolDown","docs":["the time it takes the ship to be able to warp again after a warp"],"type":"u16"},{"name":"subwarpFuelConsumptionRate","docs":["the amount of fuel consumed by the ship when sub-warp moving"],"type":"u32"},{"name":"warpFuelConsumptionRate","docs":["the amount of fuel consumed by the ship when warp moving"],"type":"u32"},{"name":"planetExitFuelAmount","docs":["the amount of fuel required to exit a planet"],"type":"u32"}]}},{"name":"MovementStatsUnpacked","docs":["Unpacked version of [`MovementStats`]"],"type":{"kind":"struct","fields":[{"name":"subwarpSpeed","docs":["the amount of distance that the ship can cover in one second while sub-warping"],"type":"u32"},{"name":"warpSpeed","docs":["the amount of distance that the ship can cover in one second while warping"],"type":"u32"},{"name":"maxWarpDistance","docs":["the max distance that the ship can warp"],"type":"u16"},{"name":"warpCoolDown","docs":["the time it takes the ship to be able to warp again after a warp"],"type":"u16"},{"name":"subwarpFuelConsumptionRate","docs":["the amount of fuel consumed by the ship when sub-warp moving"],"type":"u32"},{"name":"warpFuelConsumptionRate","docs":["the amount of fuel consumed by the ship when warp moving"],"type":"u32"},{"name":"planetExitFuelAmount","docs":["the amount of fuel required to exit a planet"],"type":"u32"}]}},{"name":"OptionalNonSystemPubkey","docs":["A pubkey sized option that is none if set to the system program."],"type":{"kind":"struct","fields":[{"name":"key","type":"publicKey"}]}},{"name":"PlanetType","docs":["Represents different types a `Planet` could be"],"type":{"kind":"enum","variants":[{"name":"Terrestrial"},{"name":"Volcanic"},{"name":"Barren"},{"name":"AsteroidBelt"},{"name":"GasGiant"},{"name":"IceGiant"},{"name":"Dark"}]}},{"name":"Points","docs":["Variables for the Points program"],"type":{"kind":"struct","fields":[{"name":"xpPointsCategory","docs":["Represents the points category to use for XP (experience points)"],"type":"publicKey"},{"name":"lpPointsCategory","docs":["Represents the points category to use for LP (loyalty points)"],"type":"publicKey"}]}},{"name":"RegisterFleetsPointsModifierInput","docs":["Struct for data input to register a points modifier for fleets program"],"type":{"kind":"struct","fields":[{"name":"canIncrement","docs":["The modifier can increment points"],"type":"bool"},{"name":"canDecrement","docs":["The modifier can decrement points"],"type":"bool"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"},{"name":"pointsCategory","docs":["The points category of the modifier (XP/LP)"],"type":"u8"}]}},{"name":"RegisterMineItemInput","docs":["Struct for data input to Register a Resource"],"type":{"kind":"struct","fields":[{"name":"name","docs":["The name of the `MineItem`"],"type":{"array":["u8",64]}},{"name":"resourceHardness","docs":["How hard it is to mine this item"],"type":"u16"},{"name":"keyIndex","docs":["the index of the key in the fleet permissions profile"],"type":"u16"}]}},{"name":"RegisterPlanetInput","docs":["Struct for data input to Register Planet"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Planet` name"],"type":{"array":["u8",64]}},{"name":"size","docs":["`Planet` size"],"type":"u64"},{"name":"maxHp","docs":["`Planet` max health"],"type":"u64"},{"name":"subCoordinates","docs":["`Planet` sub_coordinates"],"type":{"array":["i64",2]}},{"name":"planetType","docs":["`Planet` type"],"type":"u8"},{"name":"position","docs":["`Planet` position"],"type":"u8"},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"RegisterResourceInput","docs":["Struct for data input to Register a Resource"],"type":{"kind":"struct","fields":[{"name":"locationType","docs":["`Resource` location type"],"type":"u8"},{"name":"systemRichness","docs":["`Resource` `system_richness`"],"type":"u16"},{"name":"keyIndex","docs":["the index of the key in the fleet permissions profile"],"type":"u16"}]}},{"name":"RegisterShipInput","docs":["Struct for data input to Register Ship"],"type":{"kind":"struct","fields":[{"name":"name","docs":["The `Ship` name/label"],"type":{"array":["u8",64]}},{"name":"sizeClass","docs":["the ships size class"],"type":{"defined":"SizeClass"}},{"name":"stats","docs":["The stats for the ship"],"type":{"defined":"ShipStatsUnpacked"}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"},{"name":"isActive","docs":["Whether the ship is initialized to active (`update_id == current_update_id`)"],"type":"bool"}]}},{"name":"RegisterStarInput","docs":["Struct for data input to Register Star"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Star` name"],"type":{"array":["u8",64]}},{"name":"size","docs":["`Star` size"],"type":"u64"},{"name":"subCoordinates","docs":["`Star` sub_coordinates"],"type":{"array":["i64",2]}},{"name":"starType","docs":["`Star` type"],"type":"u8"},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"RegisterStarbaseInput","docs":["Struct for data input to Register `Starbase`"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Starbase` name"],"type":{"array":["u8",64]}},{"name":"subCoordinates","docs":["`Starbase` coordinates"],"type":{"array":["i64",2]}},{"name":"starbaseLevelIndex","docs":["The index representing the level of the `Starbase` in the game variables."],"type":"u8"},{"name":"faction","docs":["The `Starbase` faction"],"type":"u8"},{"name":"keyIndex","docs":["the index of the key in the fleet permissions profile"],"type":"u16"}]}},{"name":"RegisterStarbaseInputUnpacked","docs":["Unpacked version of [`RegisterStarbaseInput`]"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Starbase` name"],"type":{"array":["u8",64]}},{"name":"subCoordinates","docs":["`Starbase` coordinates"],"type":{"array":["i64",2]}},{"name":"starbaseLevelIndex","docs":["The index representing the level of the `Starbase` in the game variables."],"type":"u8"},{"name":"faction","docs":["The `Starbase` faction"],"type":"u8"},{"name":"keyIndex","docs":["the index of the key in the fleet permissions profile"],"type":"u16"}]}},{"name":"RegisterSurveyDataUnitTrackerInput","docs":["Struct for data input to Register SurveyDataUnitTracker"],"type":{"kind":"struct","fields":[{"name":"limit","docs":["The global limit on how many SDUs can be found in a `MAX_SECONDS` second period"],"type":"u32"},{"name":"scanCooldown","docs":["The amount of time that must go by before someone can scan a sector again"],"type":"u16"},{"name":"probability","docs":["The chance that a player gets an SDU on a legitimate scan, this is meant to be a percentage"],"type":"u16"},{"name":"max","docs":["The max number of SDUs that can be found while scanning"],"type":"u16"},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"RemoveShipEscrowInput","docs":["Struct for data input for `RemoveShipEscrow`"],"type":{"kind":"struct","fields":[{"name":"shipAmount","docs":["Amount of `Ship` tokens to transfer from escrow"],"type":"u64"},{"name":"permissionKeyIndex","docs":["the index of the `ProfileKey` in `Profile` with required permissions"],"type":"u16"},{"name":"shipEscrowIndex","docs":["Index of `WrappedShipEscrow` in remaining data of `StarbasePlayer`"],"type":"u32"}]}},{"name":"Respawn","docs":["The data for the [`FleetStateData::Respawn`](crate::state_machine::FleetStateData::Respawn) state"],"type":{"kind":"struct","fields":[{"name":"sector","docs":["The star system the fleet was in when it entered the `Respawn` state"],"type":{"array":["i64",2]}},{"name":"start","docs":["The time `Respawn` started"],"type":"i64"}]}},{"name":"RespawnToLoadingBayInput","docs":["Struct for data input to `RespawnToLoadingBay`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"RiskZoneData","docs":["`RiskZone` center and radius"],"type":{"kind":"struct","fields":[{"name":"center","docs":["Risk zone center"],"type":{"array":["i64",2]}},{"name":"radius","docs":["Risk zone radius"],"type":"u64"}]}},{"name":"RiskZoneDataUnpacked","docs":["Unpacked version of [`RiskZoneData`]"],"type":{"kind":"struct","fields":[{"name":"center","docs":["Risk zone center"],"type":{"array":["i64",2]}},{"name":"radius","docs":["Risk zone radius"],"type":"u64"}]}},{"name":"RiskZonesData","docs":["[`RiskZoneData`] for [`RiskZones`]"],"type":{"kind":"struct","fields":[{"name":"mudSecurityZone","docs":["Mud security zone"],"type":{"defined":"RiskZoneData"}},{"name":"oniSecurityZone","docs":["Oni security zone"],"type":{"defined":"RiskZoneData"}},{"name":"usturSecurityZone","docs":["Ustur security zone"],"type":{"defined":"RiskZoneData"}},{"name":"highRiskZone","docs":["High risk zone"],"type":{"defined":"RiskZoneData"}},{"name":"mediumRiskZone","docs":["Medium risk zone"],"type":{"defined":"RiskZoneData"}}]}},{"name":"RiskZonesDataUnpacked","docs":["Unpacked version of [`RiskZonesData`]"],"type":{"kind":"struct","fields":[{"name":"mudSecurityZone","docs":["Mud security zone"],"type":{"defined":"RiskZoneData"}},{"name":"oniSecurityZone","docs":["Oni security zone"],"type":{"defined":"RiskZoneData"}},{"name":"usturSecurityZone","docs":["Ustur security zone"],"type":{"defined":"RiskZoneData"}},{"name":"highRiskZone","docs":["High risk zone"],"type":{"defined":"RiskZoneData"}},{"name":"mediumRiskZone","docs":["Medium risk zone"],"type":{"defined":"RiskZoneData"}}]}},{"name":"ScanForSurveyDataUnitsInput","docs":["Struct for data input to Scan For Survey Data Units"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["The index of the key in the player profile"],"type":"u16"}]}},{"name":"SectorConnection","docs":["Connection between sectors"],"type":{"kind":"struct","fields":[{"name":"connectionSector","docs":["The sector connected to"],"type":"publicKey"},{"name":"subCoordinates","docs":["The location of the connection"],"type":{"array":["i64",2]}},{"name":"flags","docs":["Connection flags"],"type":"u8"}]}},{"name":"SectorRing","docs":["Represents the orbital position of a `Planet` in the `Sector`"],"type":{"kind":"enum","variants":[{"name":"Inner"},{"name":"Mid"},{"name":"Outer"}]}},{"name":"ShipCounts","docs":["Ship counts for a fleet."],"type":{"kind":"struct","fields":[{"name":"total","docs":["The total number of ships in the fleet."],"type":"u32"},{"name":"updated","docs":["Used when updating a fleet.","Value is 0 when fleet update is in progress"],"type":"u32"},{"name":"xxSmall","docs":["The number of xx small ships in the fleet."],"type":"u16"},{"name":"xSmall","docs":["The number of x small ships in the fleet."],"type":"u16"},{"name":"small","docs":["The number of small ships in the fleet."],"type":"u16"},{"name":"medium","docs":["The number of medium ships in the fleet."],"type":"u16"},{"name":"large","docs":["The number of large ships in the fleet."],"type":"u16"},{"name":"capital","docs":["The number of capital ships in the fleet."],"type":"u16"},{"name":"commander","docs":["The number of commander ships in the fleet."],"type":"u16"},{"name":"titan","docs":["The number of titan ships in the fleet."],"type":"u16"}]}},{"name":"ShipCountsUnpacked","docs":["Unpacked version of [`ShipCounts`]"],"type":{"kind":"struct","fields":[{"name":"total","docs":["The total number of ships in the fleet."],"type":"u32"},{"name":"updated","docs":["Used when updating a fleet.","Value is 0 when fleet update is in progress"],"type":"u32"},{"name":"xxSmall","docs":["The number of xx small ships in the fleet."],"type":"u16"},{"name":"xSmall","docs":["The number of x small ships in the fleet."],"type":"u16"},{"name":"small","docs":["The number of small ships in the fleet."],"type":"u16"},{"name":"medium","docs":["The number of medium ships in the fleet."],"type":"u16"},{"name":"large","docs":["The number of large ships in the fleet."],"type":"u16"},{"name":"capital","docs":["The number of capital ships in the fleet."],"type":"u16"},{"name":"commander","docs":["The number of commander ships in the fleet."],"type":"u16"},{"name":"titan","docs":["The number of titan ships in the fleet."],"type":"u16"}]}},{"name":"ShipSizes","docs":["Ship sizes."],"type":{"kind":"struct","fields":[{"name":"xxSmall","docs":["The size of xx small ships"],"type":"u8"},{"name":"xSmall","docs":["The size of x small ships"],"type":"u8"},{"name":"small","docs":["The size of small ships"],"type":"u8"},{"name":"medium","docs":["The size of medium ships"],"type":"u8"},{"name":"large","docs":["The size of large ships"],"type":"u8"},{"name":"capital","docs":["The size of capital ships"],"type":"u8"},{"name":"commander","docs":["The size of commander ships"],"type":"u8"},{"name":"titan","docs":["The size of titan ships"],"type":"u8"}]}},{"name":"ShipStats","docs":["A ships stats"],"type":{"kind":"struct","fields":[{"name":"movementStats","docs":["Movement stats for the ship"],"type":{"defined":"MovementStats"}},{"name":"cargoStats","docs":["Cargo stats for the ship"],"type":{"defined":"CargoStats"}},{"name":"miscStats","docs":["Miscellaneous stats for the ship"],"type":{"defined":"MiscStats"}}]}},{"name":"ShipStatsUnpacked","docs":["Unpacked version of [`ShipStats`]"],"type":{"kind":"struct","fields":[{"name":"movementStats","docs":["Movement stats for the ship"],"type":{"defined":"MovementStats"}},{"name":"cargoStats","docs":["Cargo stats for the ship"],"type":{"defined":"CargoStats"}},{"name":"miscStats","docs":["Miscellaneous stats for the ship"],"type":{"defined":"MiscStats"}}]}},{"name":"SizeClass","docs":["Represents different types of Ships"],"type":{"kind":"enum","variants":[{"name":"XxSmall"},{"name":"XSmall"},{"name":"Small"},{"name":"Medium"},{"name":"Large"},{"name":"Capital"},{"name":"Commander"},{"name":"Titan"}]}},{"name":"StarType","docs":["Represents different types of Stars"],"type":{"kind":"enum","variants":[{"name":"WhiteDwarf"},{"name":"RedDwarf"},{"name":"Solar"},{"name":"HotBlue"},{"name":"RedGiant"}]}},{"name":"StarbaseCancelCraftingProcessInput","docs":["Struct for data input to cancel a `CraftingProcess`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseClaimCraftingNonConsumablesInput","docs":["Struct for data input to Claim Crafting Process Non-consumable inputs"],"type":{"kind":"struct","fields":[{"name":"ingredientIndex","docs":["the index of the recipe output"],"type":"u16"}]}},{"name":"StarbaseClaimCraftingOutputInput","docs":["Struct for data input to close a `CraftingProcess`"],"type":{"kind":"struct","fields":[{"name":"ingredientIndex","docs":["the index of the recipe output"],"type":"u16"}]}},{"name":"StarbaseCloseCraftingProcessInput","docs":["Struct for data input to close a `CraftingProcess`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseCreateCargoPodInput","docs":["Struct for data input to `StarbaseCreateCargoPod`"],"type":{"kind":"struct","fields":[{"name":"podSeeds","docs":["cargo pod seeds"],"type":{"array":["u8",32]}},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseCreateCraftingProcessInput","docs":["Struct for data input to create a `CraftingProcess`"],"type":{"kind":"struct","fields":[{"name":"craftingId","docs":["crafting id"],"type":"u64"},{"name":"recipeCategoryIndex","docs":["the index of the recipes category"],"type":"u16"},{"name":"quantity","docs":["quantity of outputs to craft"],"type":"u64"},{"name":"numCrew","docs":["number of crew members to use for this crafting process"],"type":"u64"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseDepositCraftingIngredientInput","docs":["Struct for data input to deposit an ingredient"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["the amount of ingredient to deposit"],"type":"u64"},{"name":"ingredientIndex","docs":["the index of the recipe ingredient"],"type":"u16"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseLevelInfo","docs":["Information associated with `Starbase` levels"],"type":{"kind":"struct","fields":[{"name":"recipeForUpgrade","docs":["The crafting recipe required to upgrade a `Starbase` to this level"],"type":"publicKey"},{"name":"recipeCategoryForLevel","docs":["The crafting recipe category enabled for crafting at a `Starbase` of this level."],"type":"publicKey"},{"name":"hp","docs":["The `Starbase` health points for this level."],"type":"u64"},{"name":"sp","docs":["The `Starbase` shield points for this level."],"type":"u64"},{"name":"sectorRingAvailable","docs":["The planet position `Ring` available for this level"],"type":"u8"},{"name":"warpLaneMovementFee","docs":["Fee charged for the warp lane movement type which is meant to be charged in ATLAS","Since ATLAS has 8 decimal places, units are in the smallest value of ATLAS possible."],"type":"u64"}]}},{"name":"StarbaseLevelInfoArrayInput","docs":["Struct for data input to Update Starbase Level Settings"],"type":{"kind":"struct","fields":[{"name":"level","docs":["The level of the `Starbase`."],"type":"u8"},{"name":"faction","docs":["The `Starbase` faction."],"type":"u8"},{"name":"hp","docs":["The `Starbase` health points for this level."],"type":"u64"},{"name":"sp","docs":["The `Starbase` shield points for this level."],"type":"u64"},{"name":"sectorRingAvailable","docs":["The planet position `Ring` available for this level"],"type":{"defined":"SectorRing"}},{"name":"warpLaneMovementFee","docs":["Fee charged for the warp lane movement type which is meant to be charged in ATLAS"],"type":"u64"}]}},{"name":"StarbaseLoadingBay","docs":["The data for the [`FleetStateData::StarbaseLoadingBay`] state"],"type":{"kind":"struct","fields":[{"name":"starbase","docs":["The `Starbase` is in the loading bay of"],"type":"publicKey"},{"name":"lastUpdate","docs":["The last time this fleet was updated"],"type":"i64"}]}},{"name":"StarbaseRemoveCargoPodInput","docs":["Struct for data input to `StarbaseRemoveCargoPod`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseStartCraftingProcessInput","docs":["Struct for data input to start a crafting process"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseState","docs":["The state of a `Starbase`."],"type":{"kind":"enum","variants":[{"name":"Active"},{"name":"Destroyed"}]}},{"name":"StarbaseTransferCargoInput","docs":["Struct for data input to `DepositCargoToGame`"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["cargo amount"],"type":"u64"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StarbaseUpgrade","docs":["The data for the `StarbaseUpgrade` state"],"type":{"kind":"struct","fields":[{"name":"starbase","docs":["The `Starbase` being upgraded"],"type":"publicKey"},{"name":"upgradeState","docs":["[`FleetStarbaseUpgradeState`]"],"type":"u8"},{"name":"startUpgrade","docs":["When the fleet started participation in the `Starbase` upgrade."],"type":"i64"},{"name":"endUpgrade","docs":["When the fleet completes participation in the `Starbase` upgrade. This is a potential end time, constrained by max resources or user decision.","If `upgrade_state` is set to `NotFullyFilled`, this is set to the max duration in upgrading state with the partial ingredients deposited."],"type":"i64"},{"name":"checksum","docs":["used to check if expected inputs have been supplied"],"type":{"array":["u8",16]}}]}},{"name":"StarbaseUpgradeLevelState","docs":["The upgrade state for one SB lvl"],"type":{"kind":"enum","variants":[{"name":"NotStarted"},{"name":"Started"},{"name":"Finished","fields":[{"name":"timestamp","docs":["Timestamp of the upgrade completion"],"type":"i64"}]}]}},{"name":"StarbaseUpgradeTask","docs":["`Starbase` upgrade task item"],"type":{"kind":"struct","fields":[{"name":"fleet","docs":["The `Fleet` Pubkey"],"type":"publicKey"},{"name":"completionTime","docs":["The timestamp at which the fleet completes its contribution to the upgrade"],"type":"i64"}]}},{"name":"StarbaseWithdrawCraftingIngredientInput","docs":["Struct for data input to withdraw an ingredient"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["the amount of ingredient to withdraw"],"type":"u64"},{"name":"ingredientIndex","docs":["the index of the recipe ingredient"],"type":"u16"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StartMiningAsteroidInput","docs":["Struct for data input for `StartMiningAsteroid`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StartSubwarpInput","docs":["Struct for data input to initialize an `SubwarpMovement`"],"type":{"kind":"struct","fields":[{"name":"toSector","docs":["The destination coordinates"],"type":{"array":["i64",2]}},{"name":"keyIndex","docs":["The index of the key in the player profile"],"type":"u16"}]}},{"name":"StopMiningAsteroidInput","docs":["Struct for data input for `StopMiningAsteroidInput`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"StopSubwarpInput","docs":["Struct for data input to stop an `SubwarpMovement`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["The index of the key in the player profile"],"type":"u16"}]}},{"name":"TransferCargoWithinFleetInput","docs":["Struct for data input to `TransferCargoWithinFleet`"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["cargo amount"],"type":"u64"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"UpdateGameInput","docs":["Struct for data input to Update instruction"],"type":{"kind":"struct","fields":[{"name":"cargo","docs":["Cargo settings"],"type":"u8"},{"name":"crafting","docs":["Crafting settings"],"type":"u8"},{"name":"mints","docs":["Mints"],"type":"u8"},{"name":"vaults","docs":["Vaults"],"type":"u8"},{"name":"points","docs":["Points settings"],"type":"u8"},{"name":"riskZones","docs":["Data for risk zones"],"type":{"option":{"defined":"RiskZonesDataUnpacked"}}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"UpdateGameStateInput","docs":["Struct for data input to Update instruction"],"type":{"kind":"struct","fields":[{"name":"fleet","docs":["Fleet settings"],"type":{"option":{"defined":"FleetInput"}}},{"name":"levers","docs":["Levers"],"type":{"option":{"defined":"LeversInput"}}},{"name":"baseEmissionsBySizeUtil","docs":["Set of derived sub-levers used in `calculate_base_emissions()`."],"type":{"option":{"defined":"BaseEmissionsBySizeUtilInput"}}},{"name":"misc","docs":["Miscellaneous settings"],"type":{"option":{"defined":"MiscVariablesInput"}}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"UpdateMineItemInput","docs":["Struct for data input to Register a Resource"],"type":{"kind":"struct","fields":[{"name":"name","docs":["The name of the `MineItem`"],"type":{"option":{"array":["u8",64]}}},{"name":"resourceHardness","docs":["How hard it is to mine this item"],"type":{"option":"u16"}},{"name":"keyIndex","docs":["the index of the key in the fleet permissions profile"],"type":"u16"}]}},{"name":"UpdatePlanetInput","docs":["Struct for data input to Update Planet"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Planet` name"],"type":{"option":{"array":["u8",64]}}},{"name":"size","docs":["`Planet` size"],"type":{"option":"u64"}},{"name":"maxHp","docs":["`Planet` max_hp"],"type":{"option":"u64"}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"UpdateResourceInput","docs":["Struct for data input to Update Resource"],"type":{"kind":"struct","fields":[{"name":"systemRichness","docs":["`Resource` richness"],"type":{"option":"u16"}},{"name":"keyIndex","docs":["the index of the key in the fleet permissions profile"],"type":"u16"}]}},{"name":"UpdateShipEscrowInput","docs":["Struct for data input for `UpdateShipEscrow`"],"type":{"kind":"struct","fields":[{"name":"shipEscrowIndex","docs":["Index of `WrappedShipEscrow` in remaining data of `StarbasePlayer`"],"type":"u32"}]}},{"name":"UpdateShipFleetInput","docs":["Struct for data input for that has `key_index`"],"type":{"kind":"struct","fields":[{"name":"shipAmount","docs":["Number of ships to add to the fleet"],"type":"u16"},{"name":"fleetShipInfoIndex","docs":["Index of `FleetShipsInfo` in remaining data of `FleetShips`"],"type":"u32"}]}},{"name":"UpdateShipInput","docs":["Struct for data input to Update Ship"],"type":{"kind":"struct","fields":[{"name":"name","docs":["The `Ship` name/label"],"type":{"array":["u8",64]}},{"name":"sizeClass","docs":["the ships size class"],"type":{"defined":"SizeClass"}},{"name":"stats","docs":["The stats for the ship"],"type":{"defined":"ShipStatsUnpacked"}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"UpdateStarInput","docs":["Struct for data input to Update Star"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Star` name"],"type":{"option":{"array":["u8",64]}}},{"name":"size","docs":["`Star` size"],"type":{"option":"u64"}},{"name":"starType","docs":["`Star` type"],"type":{"option":"u8"}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"UpdateStarbaseInput","docs":["Struct for data input to Update `Starbase`"],"type":{"kind":"struct","fields":[{"name":"name","docs":["`Starbase` name"],"type":{"option":{"array":["u8",64]}}},{"name":"subCoordinates","docs":["`Starbase` coordinates"],"type":{"option":{"array":["i64",2]}}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"UpdateSurveyDataUnitTrackerInput","docs":["Struct for data input to Update SurveyDataUnitTracker"],"type":{"kind":"struct","fields":[{"name":"limit","docs":["The global limit on how many SDUs can be found in a `MAX_SECONDS` second period"],"type":{"option":"u32"}},{"name":"scanCooldown","docs":["The amount of time that must go by before someone can scan a sector again"],"type":{"option":"u16"}},{"name":"probability","docs":["The chance that a player gets an SDU on a legitimate scan, this is meant to be a percentage"],"type":{"option":"u16"}},{"name":"max","docs":["The max number of SDUs that can be found while scanning"],"type":{"option":"u16"}},{"name":"keyIndex","docs":["the index of the key in the sector permissions profile"],"type":"u16"}]}},{"name":"Vaults","docs":["Token vaults"],"type":{"kind":"struct","fields":[{"name":"atlas","docs":["ATLAS token mint"],"type":"publicKey"},{"name":"polis","docs":["POLIS token mint"],"type":"publicKey"}]}},{"name":"WarpLaneInput","docs":["Struct for data input to initialize a `WarpLane`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["The index of the key in the player profile"],"type":"u16"},{"name":"toSectorIndex","docs":["Index of the to_sector in `SectorConnections` of the from_sector"],"type":"u16"},{"name":"fromSectorIndex","docs":["Index of the from_sector in `SectorConnections` of the to_sector"],"type":"u16"}]}},{"name":"WarpToCoordinateInput","docs":["Struct for data input to initialize a `WarpToCoordinate`"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["The index of the key in the player profile"],"type":"u16"},{"name":"toSector","docs":["The destination coordinates"],"type":{"array":["i64",2]}}]}},{"name":"WithdrawCargoFromFleetInput","docs":["Struct for data input to `WithdrawCargoFromFleet`"],"type":{"kind":"struct","fields":[{"name":"amount","docs":["cargo amount"],"type":"u64"},{"name":"keyIndex","docs":["the index of the key in the player profile"],"type":"u16"}]}},{"name":"WrappedShipEscrow","docs":["Wrapped `Ship` escrow info"],"type":{"kind":"struct","fields":[{"name":"ship","docs":["The `Ship` account address"],"type":"publicKey"},{"name":"amount","docs":["The `Ship` token amount in escrow"],"type":"u64"},{"name":"updateId","docs":["The update id for the `Ship`"],"type":"u64"}]}}],"errors":[{"code":6000,"name":"IncorrectAdminAddress","msg":"Incorrect admin address."},{"code":6001,"name":"MissingRemainingAccount","msg":"An expected remaining account is missing."},{"code":6002,"name":"NoStargateConnectionsAvailable","msg":"No Stargate connections available."},{"code":6003,"name":"StargatesNotConnected","msg":"The provided Stargates are not connected."},{"code":6004,"name":"InvalidPlanetType","msg":"Invalid Planet Type."},{"code":6005,"name":"InvalidRingType","msg":"Invalid Ring Type."},{"code":6006,"name":"InvalidStarType","msg":"Invalid Star Type."},{"code":6007,"name":"InvalidOrInactiveGame","msg":"Invalid Or Inactive Game"},{"code":6008,"name":"InvalidShipSizeClass","msg":"Invalid Ship Size Class."},{"code":6009,"name":"IncorrectAccountSize","msg":"Incorrect Account Size."},{"code":6010,"name":"UpdateIdMismatch","msg":"The update_id is mismatched."},{"code":6011,"name":"AlreadyActive","msg":"The account is already active."},{"code":6012,"name":"InactiveAccount","msg":"The account is inactive."},{"code":6013,"name":"InvalidGame","msg":"The game account is invalid."},{"code":6014,"name":"InvalidGameState","msg":"The game state account is invalid."},{"code":6015,"name":"InvalidSector","msg":"The sector account is invalid."},{"code":6016,"name":"IncorrectVarsAccountAddress","msg":"Incorrect sage game_id account address."},{"code":6017,"name":"InsufficientFuel","msg":"Insufficient Fuel to complete movement"},{"code":6018,"name":"DistanceGreaterThanMax","msg":"Distance of movement is greater than the allowed maximum"},{"code":6019,"name":"NumericOverflow","msg":"Numeric overflow"},{"code":6020,"name":"InvalidLocationType","msg":"Invalid Location Type."},{"code":6021,"name":"LocationTypeNotSupported","msg":"The provided location type is not supported."},{"code":6022,"name":"IncorrectMineItem","msg":"Incorrect mine item address."},{"code":6023,"name":"IncorrectAuthorityAddress","msg":"Incorrect authority address."},{"code":6024,"name":"IncorrectResourceAddress","msg":"Incorrect resource address."},{"code":6025,"name":"IncorrectMintAuthority","msg":"Incorrect mint authority."},{"code":6026,"name":"MintAuthorityIsNone","msg":"The mint authority should exist."},{"code":6027,"name":"InvalidCurrentFleetState","msg":"The current fleet state is not valid."},{"code":6028,"name":"InvalidCurrentStarbaseState","msg":"The current starbase state is not valid."},{"code":6029,"name":"AuthorityMismatch","msg":"Authority mismatch"},{"code":6030,"name":"MintMismatch","msg":"Mint mismatch"},{"code":6031,"name":"TokenMismatch","msg":"Incorrect token address."},{"code":6032,"name":"OwnerMismatch","msg":"Owner mismatch"},{"code":6033,"name":"GameMismatch","msg":"Game ID mismatch"},{"code":6034,"name":"ProfileMismatch","msg":"Profile mismatch"},{"code":6035,"name":"SagePlayerProfileMismatch","msg":"SagePlayerProfile mismatch"},{"code":6036,"name":"StarbaseMismatch","msg":"Starbase mismatch"},{"code":6037,"name":"FactionMismatch","msg":"Faction mismatch"},{"code":6038,"name":"SeqIdMismatch","msg":"Sequence id mismatch"},{"code":6039,"name":"ShipMismatch","msg":"Ship mismatch"},{"code":6040,"name":"CargoPodMismatch","msg":"Cargo Pod mismatch"},{"code":6041,"name":"PlanetMismatch","msg":"Planet mismatch"},{"code":6042,"name":"MineItemMismatch","msg":"MineItem mismatch"},{"code":6043,"name":"LocationMismatch","msg":"Location mismatch"},{"code":6044,"name":"InvalidEscrowKey","msg":"Escrow key not found in remaining data"},{"code":6045,"name":"InvalidShipAmount","msg":"Insufficient Ship token amount"},{"code":6046,"name":"InvalidShipHangarSpaceAmount","msg":"Insufficient Ship hangar space amount"},{"code":6047,"name":"InvalidCrewAmount","msg":"Invalid crew amount"},{"code":6048,"name":"InvalidState","msg":"Invalid state"},{"code":6049,"name":"InvalidDistance","msg":"Invalid distance"},{"code":6050,"name":"NotAtCentralSpaceStation","msg":"Not at central space station"},{"code":6051,"name":"ShipNotExpected","msg":"The instruction does not expect a ship account"},{"code":6052,"name":"AddressMismatch","msg":"Address mismatch"},{"code":6053,"name":"InvalidSectorConnection","msg":"Invalid sector connection"},{"code":6054,"name":"InvalidStarbaseLevel","msg":"Invalid Starbase level"},{"code":6055,"name":"InvalidStarbaseUpgradeRecipeCategory","msg":"Invalid Starbase upgrade recipe category"},{"code":6056,"name":"HangarUpgradeNotPossible","msg":"Hangar upgrade not Possible"},{"code":6057,"name":"DisbandedFleetNotEmpty","msg":"Disbanded fleet not empty"},{"code":6058,"name":"FaultyMovement","msg":"Faulty movement"},{"code":6059,"name":"IncorrectHandleRawAccount","msg":"Incorrect Account Type for Handle Raw"},{"code":6060,"name":"InsufficientShipCargoCapacity","msg":"Insufficient Ship Cargo Capacity"},{"code":6061,"name":"FleetDoesNotNeedUpdate","msg":"Fleet does not need update"},{"code":6062,"name":"MustDisbandFleet","msg":"Must disband fleet"},{"code":6063,"name":"CannotForceDisbandFleet","msg":"Cannot force-disband fleet"},{"code":6064,"name":"ShipMismatchOrAlreadyUpdated","msg":"Ship mismatch or already updated"},{"code":6065,"name":"ShipAlreadyUpdated","msg":"Ship already updated"},{"code":6066,"name":"InvalidNextShipAddress","msg":"Invalid next ship address"},{"code":6067,"name":"InvalidShipForForcedDisband","msg":"Ship is not valid for forced disband of fleet"},{"code":6068,"name":"InvalidWarpRange","msg":"Warp range exceeded"},{"code":6069,"name":"InvalidIngredient","msg":"Invalid Ingredient"},{"code":6070,"name":"StarbaseUpgradeNotInProgress","msg":"Starbase Upgrade Not in progress"},{"code":6071,"name":"FleetNotInQueue","msg":"Fleet Not in queue"},{"code":6072,"name":"NeedCleanStarbaseUpgradeQueue","msg":"Need to clean Starbase upgrade queue"},{"code":6073,"name":"PlanetNotReachable","msg":"Planet Not Reachable"},{"code":6074,"name":"RespawnNotPossible","msg":"Respawn Not Possible"},{"code":6075,"name":"InvalidMovement","msg":"Cannot enter enemy factions Security Zone"},{"code":6076,"name":"CargoAmountAboveZero","msg":"The Cargo Pod contains a non-zero amount of the Cargo Type"},{"code":6077,"name":"InvalidCargoPod","msg":"The Cargo Pod is invalid"},{"code":6078,"name":"InvalidZoneCoordinates","msg":"Invalid Zone Coordinates"},{"code":6079,"name":"RespawnTimeNotElapsed","msg":"Respawn time not elapsed"},{"code":6080,"name":"ActiveAccount","msg":"The Account is Active"},{"code":6081,"name":"StarbasePlayerMismatch","msg":"Starbase Player mismatch"},{"code":6082,"name":"AlreadyProcessed","msg":"The account has already been processed"},{"code":6083,"name":"InvalidAmount","msg":"The amount is invalid"},{"code":6084,"name":"WarpIsOnCooldown","msg":"Warp is on cooldown"},{"code":6085,"name":"ProgramMismatch","msg":"Program Mismatch"},{"code":6086,"name":"MustBeOnlyInstruction","msg":"Current Instruction Is Not Only Instruction"},{"code":6087,"name":"InvalidTime","msg":"Invalid Time"},{"code":6088,"name":"ScanIsOnCooldown","msg":"Scanning is on cooldown"},{"code":6089,"name":"InvalidFleetSize","msg":"Invalid Fleet Size"},{"code":6090,"name":"InactiveFeature","msg":"The feature is inactive"},{"code":6091,"name":"ZeroShipsAdded","msg":"Zero ships added to fleet"},{"code":6092,"name":"GenericInvalid","msg":"Generic invalid data"}]}');
    const sageProgramId = new solanaWeb3.PublicKey('SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6');
    const profileIDL = JSON.parse('{"version":"0.7.0","name":"player_profile","instructions":[{"name":"acceptRoleInvitation","accounts":[{"name":"newMember","isMut":false,"isSigner":false,"docs":["The new member"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role which the player is joining"]},{"name":"roleMembershipAccount","isMut":true,"isSigner":false,"docs":["The role membership account for the new member"]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"keyIndexInRoleAccount","type":"u16"},{"name":"keyIndexInMembershipAccount","type":"u16"}]},{"name":"addExistingMemberToRole","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for reallocation."]},{"name":"newMember","isMut":false,"isSigner":false,"docs":["The profile of the member to be added to the role"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile which the role belongs to."]},{"name":"roleMembershipAccount","isMut":true,"isSigner":false,"docs":["The role membership account for the new member"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role which the player is joining"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"keyIndexInMembershipAccount","type":"u16"}]},{"name":"addKeys","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the profile."]},{"name":"key","isMut":false,"isSigner":true,"docs":["Key with [`ProfilePermissions::ADD_KEYS`] permission to add keys."]},{"name":"profile","isMut":true,"isSigner":false,"docs":["The profile to add to"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyAddIndex","type":"u16"},{"name":"keyPermissionsIndex","type":"u16"},{"name":"keysToAdd","type":{"vec":{"defined":"AddKeyInput"}}}]},{"name":"adjustAuth","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the profile."]},{"name":"profile","isMut":true,"isSigner":false,"docs":["The profile to create"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"authIndexes","type":{"vec":"u16"}},{"name":"newKeyPermissions","type":{"vec":{"defined":"AddKeyInput"}}},{"name":"removeRange","type":{"array":["u16",2]}},{"name":"newKeyThreshold","type":"u8"}]},{"name":"createProfile","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new profile."]},{"name":"profile","isMut":true,"isSigner":true,"docs":["The profile to create"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyPermissions","type":{"vec":{"defined":"AddKeyInput"}}},{"name":"keyThreshold","type":"u8"}]},{"name":"createRole","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the transaction"]},{"name":"profile","isMut":true,"isSigner":false,"docs":["The [`Profile`] account that the role is being created for"]},{"name":"newRoleAccount","isMut":true,"isSigner":false,"docs":["The role account being created"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"inviteMemberToRole","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new profile."]},{"name":"newMember","isMut":false,"isSigner":false,"docs":["The profile of the user to be added to the role"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile which the role belongs to."]},{"name":"roleMembershipAccount","isMut":true,"isSigner":false,"docs":["The role membership account for the new member"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role which the player is joining"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"joinRole","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new profile."]},{"name":"newMember","isMut":false,"isSigner":false,"docs":["The new member joining the role"]},{"name":"roleMembershipAccount","isMut":true,"isSigner":false,"docs":["The role membership account for the new member"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role which the player is joining"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"leaveRole","accounts":[{"name":"funder","isMut":true,"isSigner":false,"docs":["The funder to receive the rent allocation."]},{"name":"member","isMut":false,"isSigner":false,"docs":["The member leaving the role"]},{"name":"roleMembershipAccount","isMut":true,"isSigner":false,"docs":["The role membership account for the member"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role which the player is leaving"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"keyIndexInRoleAccount","type":"u16"},{"name":"keyIndexInMembershipAccount","type":"u16"}]},{"name":"removeKeys","accounts":[{"name":"funder","isMut":true,"isSigner":false,"docs":["The funder for the profile."]},{"name":"key","isMut":false,"isSigner":true,"docs":["Key with [`ProfilePermissions::REMOVE_KEYS`] permission to add keys."]},{"name":"profile","isMut":true,"isSigner":false,"docs":["The profile to remove from"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"keysToRemove","type":{"array":["u16",2]}}]},{"name":"removeMemberFromRole","accounts":[{"name":"funder","isMut":true,"isSigner":false,"docs":["The funder to receive the rent allocation"]},{"name":"member","isMut":false,"isSigner":false,"docs":["The profile of the user to be added to the role"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile which the role belongs to."]},{"name":"roleMembershipAccount","isMut":true,"isSigner":false,"docs":["The role membership account for the member"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role which the player is being removed from"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"keyIndexInRoleAccount","type":"u16"},{"name":"keyIndexInMembershipAccount","type":"u16"}]},{"name":"removeRole","accounts":[{"name":"funder","isMut":true,"isSigner":false,"docs":["The funder for the transaction"]},{"name":"profile","isMut":true,"isSigner":false,"docs":["The Profile that the role is being removed from"]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role being removed"]},{"name":"roleNameAccount","isMut":true,"isSigner":false,"docs":["The role name account (if it exists)"]}],"args":[{"name":"roleNameBump","type":"u8"},{"name":"keyIndex","type":"u16"}]},{"name":"setName","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized to change the name."]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the name size change."]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile to set the name for."]},{"name":"name","isMut":true,"isSigner":false,"docs":["The name account."]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program."]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"name","type":"bytes"}]},{"name":"setRoleAcceptingMembers","accounts":[{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile which owns the role being modified."]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role account to set as accepting members."]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"setRoleAuthorizer","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the name size change."]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile to set the name for."]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role account to set the authorizer for."]},{"name":"authorizer","isMut":false,"isSigner":false,"docs":["The authorizer account to set."]}],"args":[{"name":"keyIndex","type":"u16"}]},{"name":"setRoleName","accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the name size change."]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile which the role belongs to"]},{"name":"role","isMut":false,"isSigner":false,"docs":["The role to set the name for."]},{"name":"name","isMut":true,"isSigner":false,"docs":["The name account."]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program."]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"name","type":"bytes"}]},{"name":"setRoleNotAcceptingMembers","accounts":[{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile which owns the role being modified."]},{"name":"roleAccount","isMut":true,"isSigner":false,"docs":["The role account to set as not accepting members."]}],"args":[{"name":"keyIndex","type":"u16"}]}],"accounts":[{"name":"PlayerName","docs":["Stores a players name on-chain."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"profile","docs":["The profile this name is for."],"type":"publicKey"},{"name":"bump","docs":["The bump for this account."],"type":"u8"}]}},{"name":"Profile","docs":["A player profile."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"authKeyCount","docs":["The number of auth keys on the account"],"type":"u16"},{"name":"keyThreshold","docs":["The number of auth keys needed to update the profile."],"type":"u8"},{"name":"nextSeqId","docs":["The next sequence number for a new role."],"type":"u64"},{"name":"createdAt","docs":["When the profile was created."],"type":"i64"}]}},{"name":"ProfileRoleMembership","docs":["A players roles for a given profile","Remaining data contains an unordered list of [`RoleMembership`](RoleMembership) structs"],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"profile","docs":["The Profile this belongs to"],"type":"publicKey"},{"name":"member","docs":["The members profile pubkey"],"type":"publicKey"},{"name":"bump","docs":["PDA bump"],"type":"u8"}]}},{"name":"Role","docs":["A Role associated with a Profile. A Role contains an unordered list of Role Members in its","remaining data which lists all of the members who carry this role."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"profile","docs":["Profile that this role belongs to"],"type":"publicKey"},{"name":"authorizer","docs":["Origin authority of the account"],"type":"publicKey"},{"name":"roleSeqId","docs":["Roles seq_id"],"type":"u64"},{"name":"acceptingNewMembers","docs":["Is role accepting new members"],"type":"u8"},{"name":"bump","docs":["The name of the rank","TODO: Add instruction to use `player-name` as the label","PDA bump"],"type":"u8"}]}}],"types":[{"name":"AddKeyInput","docs":["Struct for adding a key"],"type":{"kind":"struct","fields":[{"name":"scope","docs":["The block of permissions"],"type":"publicKey"},{"name":"expireTime","docs":["The expire time of the key to add"],"type":"i64"},{"name":"permissions","docs":["The permissions for the key"],"type":{"array":["u8",8]}}]}},{"name":"MemberStatus","docs":["Represents potential membership statuses for a player with a role"],"type":{"kind":"enum","variants":[{"name":"Inactive"},{"name":"Active"}]}},{"name":"ProfileKey","docs":["A key on a profile."],"type":{"kind":"struct","fields":[{"name":"key","docs":["The key."],"type":"publicKey"},{"name":"scope","docs":["The key for the permissions."],"type":"publicKey"},{"name":"expireTime","docs":["The expire time for this key.","If `<0` does not expire."],"type":"i64"},{"name":"permissions","docs":["The permissions for the key."],"type":{"array":["u8",8]}}]}},{"name":"RoleMembership","docs":["Represents a members status in a role"],"type":{"kind":"struct","fields":[{"name":"key","docs":["The member or role key associated with this membership"],"type":"publicKey"},{"name":"status","docs":["The members role status"],"type":"u8"}]}}],"errors":[{"code":6000,"name":"KeyIndexOutOfBounds","msg":"Key index out of bounds"},{"code":6001,"name":"ProfileMismatch","msg":"Profile did not match profile key"},{"code":6002,"name":"KeyMismatch","msg":"Key did not match profile key"},{"code":6003,"name":"ScopeMismatch","msg":"Scope did not match profile scope"},{"code":6004,"name":"KeyExpired","msg":"Key expired"},{"code":6005,"name":"KeyMissingPermissions","msg":"Key is missing permissions"},{"code":6006,"name":"PermissionsMismatch","msg":"Permissions dont match available"},{"code":6007,"name":"AuthKeyCannotExpire","msg":"Auth keys cannot expire"},{"code":6008,"name":"AuthKeyMustSign","msg":"New auth keys must be signers"},{"code":6009,"name":"DuplicateAuthKey","msg":"Duplicate key when adjusting auth keys"},{"code":6010,"name":"RoleAuthorityAlreadySet","msg":"Role authority has already been set"},{"code":6011,"name":"RoleNotAcceptingMembers","msg":"Role is not accepting new members"},{"code":6012,"name":"RoleMembershipMismatch","msg":"Role membership is not as expected"},{"code":6013,"name":"RoleLimitExceeded","msg":"Role limit exceeded"},{"code":6014,"name":"RoleHasMembers","msg":"Cannot remove role with members"},{"code":6015,"name":"FeatureNotImplemented","msg":"This feature is not yet support"}]}');
    const profileProgramId = new solanaWeb3.PublicKey('pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9');
    const cargoIDL = JSON.parse('{"version":"0.1.0","name":"cargo","docs":["The `cargo` program"],"instructions":[{"name":"addCargo","docs":["Adds cargo to a [`CargoPod`](state::CargoPod).","Requires the authority to sign."],"accounts":[{"name":"authority","isMut":false,"isSigner":true,"docs":["Authority for the cargo pod"]},{"name":"signerOriginAccount","isMut":false,"isSigner":true,"docs":["Signer for Cargo Token Transfer"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"originTokenAccount","isMut":true,"isSigner":false,"docs":["The Origin Token Account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"cargoAmount","type":"u64"}]},{"name":"closeCargoPod","docs":["Closes the [`CargoPod`](state::CargoPod) if it has no open token accounts.","Requires the authority to sign."],"accounts":[{"name":"funder","isMut":true,"isSigner":false,"docs":["The account to return the rent"]},{"name":"authority","isMut":false,"isSigner":true,"docs":["The authority for the pod account"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system Program"]}],"args":[]},{"name":"closeTokenAccount","docs":["Closes and burns any excess tokens in a given token account within a [`CargoPod`](state::CargoPod).","Requires the authority to sign."],"accounts":[{"name":"funder","isMut":true,"isSigner":false,"docs":["The account to return the rent"]},{"name":"authority","isMut":false,"isSigner":true,"docs":["The authority for [CargoPod] account"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"mint","isMut":true,"isSigner":false,"docs":["The Token Mint"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["The Token Program"]}],"args":[]},{"name":"consumeCargo","docs":["Consumes cargo from a [`CargoPod`](state::CargoPod), burning the amount.","Requires the authority to sign."],"accounts":[{"name":"authority","isMut":false,"isSigner":true,"docs":["Authority for the cargo pod"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["Token Mint"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"cargoAmount","type":"u64"}]},{"name":"initCargoPod","docs":["Inits a new [`CargoPod`](state::CargoPod) account for the given [`CargoStatsDefinition`](state::CargoStatsDefinition) and authority."],"accounts":[{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new cargo pod"]},{"name":"authority","isMut":false,"isSigner":true,"docs":["The authority for the new cargo pod"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The new cargo pod"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The definition of tracked stats"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"podSeeds","type":{"array":["u8",32]}}]},{"name":"initCargoType","docs":["Inits a new [`CargoType`](state::CargoType) account for the given [`CargoStatsDefinition`](state::CargoStatsDefinition)."],"accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The crafting permissions [`Profile`].","Is going to act as the authority for the new definition."]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the cargo type"]},{"name":"mint","isMut":false,"isSigner":false,"docs":["The mint for the new cargo type"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The definition for the cargo type"]},{"name":"cargoType","isMut":true,"isSigner":false,"docs":["The cargo type to init"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"InitCargoTypeInput"}}]},{"name":"initCargoTypeForNextSeqId","docs":["Creates a new cargo type for the next `seq_id`."],"accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The cargo permissions [`Profile`].","Is going to act as the authority for the new definition."]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the cargo type"]},{"name":"mint","isMut":false,"isSigner":false,"docs":["The mint for the new cargo type"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The definition for the cargo type"]},{"name":"cargoType","isMut":true,"isSigner":false,"docs":["The cargo type to init"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"InitCargoTypeInput"}}]},{"name":"initCargoTypeFromOldCargoType","docs":["Creates a new cargo type for the next `seq_id` from a given cargo type."],"accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The cargo permissions [`Profile`].","Is going to act as the authority for the new definition."]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the cargo type"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The definition for the cargo type"]},{"name":"oldCargoType","isMut":false,"isSigner":false,"docs":["The old Cargo Type Account"]},{"name":"cargoType","isMut":true,"isSigner":false,"docs":["The cargo type to init"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"InitCargoTypeFromOldCargoTypeInput"}}]},{"name":"initDefinition","docs":["Inits a [`CargoStatsDefinition`](state::CargoStatsDefinition) account."],"accounts":[{"name":"profile","isMut":false,"isSigner":false,"docs":["The cargo permissions [`Profile`](player_profile::state::Profile).","Is going to act as the authority for the new definition."]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the new definition"]},{"name":"statsDefinition","isMut":true,"isSigner":true,"docs":["The new definition"]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program"]}],"args":[{"name":"input","type":{"defined":"InitDefinitionInput"}}]},{"name":"legitimizeCargo","docs":["Legitimizes cargo in a [`CargoPod`](state::CargoPod) that was added outside of [`add_cargo`] or other cargo ix.","Requires the authority to sign."],"accounts":[{"name":"authority","isMut":false,"isSigner":true,"docs":["Authority for the cargo pod"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"cargoAmount","type":"u64"}]},{"name":"mintTo","docs":["Mints tokens directly to a [`CargoPod`](state::CargoPod).","Requires the authority to sign."],"accounts":[{"name":"authority","isMut":false,"isSigner":true,"docs":["Authority for the [`CargoPod`] Account"]},{"name":"mintAuthority","isMut":false,"isSigner":true,"docs":["The mint Authority"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [`CargoPod`] Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The [`CargoType`] Account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The Cargo token mint"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"mintAmount","type":"u64"}]},{"name":"removeCargo","docs":["Removes cargo from a [`CargoPod`](state::CargoPod) to a given token account.","Requires the authority to sign."],"accounts":[{"name":"authority","isMut":false,"isSigner":true,"docs":["Authority for the cargo pod"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"destinationTokenAccount","isMut":true,"isSigner":false,"docs":["The Destination Token Account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["Cargo Token Account"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"cargoAmount","type":"u64"}]},{"name":"transferAuthority","docs":["Transfers authority of a [`CargoPod`](state::CargoPod) to a new authority.","Requires both authorities to sign."],"accounts":[{"name":"originPodAuthority","isMut":false,"isSigner":true,"docs":["Authority for the cargo pod"]},{"name":"newPodAuthority","isMut":false,"isSigner":true,"docs":["New authority for the cargo pod"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]}],"args":[]},{"name":"transferCargo","docs":["Transfers cargo between [`CargoPod`](state::CargoPod)s.","Requires both authorities to sign."],"accounts":[{"name":"originPodAuthority","isMut":false,"isSigner":true,"docs":["Authority for the origin cargo pod"]},{"name":"destinationPodAuthority","isMut":false,"isSigner":true,"docs":["Authority for the destination cargo pod"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"originCargoPod","isMut":true,"isSigner":false,"docs":["The Origin [CargoPod] Account"]},{"name":"destinationCargoPod","isMut":true,"isSigner":false,"docs":["The Destination [CargoPod] Account"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The Cargo Type Account"]},{"name":"originTokenAccount","isMut":true,"isSigner":false,"docs":["The Origin Token Account"]},{"name":"destinationTokenAccount","isMut":true,"isSigner":false,"docs":["The Destination Token Account"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[{"name":"cargoAmount","type":"u64"}]},{"name":"updateCargoPod","docs":["Updates a [`CargoPod`](state::CargoPod) account to have the newest sequence id from the [`CargoDefinition`](state::CargoStatsDefinition).","This is the first step to update a [`CargoPod`](state::CargoPod) to a new [`CargoStatsDefinition`](state::CargoStatsDefinition).","Permissionless function."],"accounts":[{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The cargo pod to update"]},{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The definition of tracked stats"]}],"args":[]},{"name":"updateDefinition","docs":["Updates a [`CargoStatsDefinition`](state::CargoStatsDefinition) account.","Will advance the `seq_id` unless `rollback` is set to true."],"accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key authorized for this instruction"]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The cargo permissions [`Profile`](player_profile::state::Profile).","Is going to act as the authority for the new definition."]},{"name":"statsDefinition","isMut":true,"isSigner":false,"docs":["The [CargoStatsDefinition]"]}],"args":[{"name":"input","type":{"defined":"UpdateDefinitionInput"}}]},{"name":"updatePodTokenAccount","docs":["Updates a [`CargoPod`](state::CargoPod)s token account to have the same sequence id as the [`CargoPod`](state::CargoPod).","This must be called after [`update_cargo_pod`].","Permissionless function."],"accounts":[{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"oldCargoType","isMut":false,"isSigner":false,"docs":["The previous version(`seq_id`) Cargo Type"]},{"name":"cargoType","isMut":false,"isSigner":false,"docs":["The updated Cargo Type Account"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[]},{"name":"updateTokenAccountForInvalidType","docs":["Removes a pods token account if it no longer has a cargo type by burning all the invalid cargo.","This must be called after [`update_cargo_pod`].","Permissionless function."],"accounts":[{"name":"statsDefinition","isMut":false,"isSigner":false,"docs":["The [CargoStatsDefinition] for the cargo type"]},{"name":"cargoPod","isMut":true,"isSigner":false,"docs":["The [CargoPod] Account"]},{"name":"oldCargoType","isMut":false,"isSigner":false,"docs":["The previous version(`seq_id`) Cargo Type"]},{"name":"cargoTokenAccount","isMut":true,"isSigner":false,"docs":["The Cargo Token Account"]},{"name":"tokenMint","isMut":true,"isSigner":false,"docs":["The Cargo token mint"]},{"name":"tokenProgram","isMut":false,"isSigner":false,"docs":["Token Program"]}],"args":[]}],"accounts":[{"name":"CargoPod","docs":["A pod that can store any number of resources and tracks stats given a definition."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"statsDefinition","docs":["The definition of tracked stats."],"type":"publicKey"},{"name":"authority","docs":["The authority for this pod."],"type":"publicKey"},{"name":"openTokenAccounts","docs":["The number of open token accounts in this pod."],"type":"u8"},{"name":"podSeeds","docs":["The seeds of the signer for this pod."],"type":{"array":["u8",32]}},{"name":"podBump","docs":["The bump of the signer for this pod."],"type":"u8"},{"name":"seqId","docs":["The sequence id for the definition"],"type":"u16"},{"name":"unupdatedTokenAccounts","docs":["The number of unupdated token accounts in this pod. If this is greater than zero means the pod is frozen and only can withdraw cargo but not deposit."],"type":"u8"}]}},{"name":"CargoStatsDefinition","docs":["A definition of cargo stats.","Remaining data is the stats."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"authority","docs":["The authority for this definition."],"type":"publicKey"},{"name":"defaultCargoType","docs":["The default cargo type. System program (all 0s) if none."],"type":"publicKey"},{"name":"statsCount","docs":["The number of stats in this definition."],"type":"u16"},{"name":"seqId","docs":["The sequence id for the definition"],"type":"u16"}]}},{"name":"CargoType","docs":["The stats for a given cargo type (token mint)."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"statsDefinition","docs":["The definition this follows"],"type":"publicKey"},{"name":"mint","docs":["The mint the cargo type is for"],"type":"publicKey"},{"name":"bump","docs":["The bump for this account"],"type":"u8"},{"name":"statsCount","docs":["The number of stats in this definition."],"type":"u16"},{"name":"seqId","docs":["The sequence id for the definition"],"type":"u16"}]}}],"types":[{"name":"InitCargoTypeFromOldCargoTypeInput","docs":["Struct for data input for this IX"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the crafting permissions profile"],"type":"u16"},{"name":"newValues","docs":["vector with values for all stats tracked by the definition"],"type":{"option":{"vec":"u64"}}}]}},{"name":"InitCargoTypeInput","docs":["Struct for data input for this IX"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the crafting permissions profile"],"type":"u16"},{"name":"values","docs":["vector with values for all stats tracked by the definition"],"type":{"vec":"u64"}}]}},{"name":"InitDefinitionInput","docs":["Struct for data input for [`InitDefinition`]"],"type":{"kind":"struct","fields":[{"name":"cargoStats","docs":["the count of stats the definition has"],"type":"u16"}]}},{"name":"UpdateDefinitionInput","docs":["Struct for data input for this IX"],"type":{"kind":"struct","fields":[{"name":"keyIndex","docs":["the index of the key in the crafting permissions profile"],"type":"u16"},{"name":"rollback","docs":["flag that if present means we need to decrease the definition seq_id"],"type":{"option":"bool"}}]}}],"errors":[{"code":6000,"name":"StatOutOfBounds","msg":"A given stat was out of bounds"},{"code":6001,"name":"TooManyStats","msg":"There are too many stats"},{"code":6002,"name":"InvalidRentFunder","msg":"Rent funder was not owned by the system program or this program"},{"code":6003,"name":"TooFewStats","msg":"Popped a stat when there are no stats left"},{"code":6004,"name":"MissingSystemProgram","msg":"System program is missing when needed"},{"code":6005,"name":"InvalidCargoStat","msg":"Cargo stat data was invalid"},{"code":6006,"name":"InvalidCargoStatSize","msg":"Cargo stat size data was invalid"},{"code":6007,"name":"InvalidCargoType","msg":"Cargo type is invalid"},{"code":6008,"name":"WrongNumberOfDefinitions","msg":"Wrong number of definitions provided to init a cargo type"},{"code":6009,"name":"InvalidValueForStat","msg":"Invalid value provided for stat"},{"code":6010,"name":"NumericOverflow","msg":"Math overflow"},{"code":6011,"name":"AuthorityMismatch","msg":"Authority mismatch"},{"code":6012,"name":"StatsDefinitionMismatch","msg":"Stats definition mismatch"},{"code":6013,"name":"MintMismatch","msg":"Mint mismatch"},{"code":6014,"name":"OwnerMismatch","msg":"Owner mismatch"},{"code":6015,"name":"InvalidDelegation","msg":"Delegated amount is invalid"},{"code":6016,"name":"FrozenPod","msg":"The pod is frozen"},{"code":6017,"name":"UnupdatedCargoPodAccount","msg":"Unupdated CargoPod Account"},{"code":6018,"name":"InvalidSeqId","msg":"Invalid seq_id"},{"code":6019,"name":"UnupdatedTokenAccount","msg":"Unupdated token account"},{"code":6020,"name":"OpenTokenAccounts","msg":"Cargo Pod has token accounts open"},{"code":6021,"name":"NonZeroDelegation","msg":"Non Zero Delegated Amount"},{"code":6022,"name":"InvalidPreviousType","msg":"Invalid previous cargo_type account"},{"code":6023,"name":"InsufficientCargoAmount","msg":"Insufficient cargo amount"},{"code":6024,"name":"InsufficientTokenAmount","msg":"Insufficient token amount"},{"code":6025,"name":"PodTokenAccountAlreadyUpdated","msg":"Pod Token Account Already Updated"}]}');
    const cargoProgramId = new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH');
    const profileFactionIDL = JSON.parse('{"version":"0.7.0","name":"profile_faction","instructions":[{"name":"chooseFaction","accounts":[{"name":"key","isMut":false,"isSigner":true,"docs":["The key with auth permissions."]},{"name":"funder","isMut":true,"isSigner":true,"docs":["The funder for the transaction."]},{"name":"profile","isMut":false,"isSigner":false,"docs":["The profile to change faction for."]},{"name":"faction","isMut":true,"isSigner":false,"docs":["The faction to change to."]},{"name":"systemProgram","isMut":false,"isSigner":false,"docs":["The system program."]}],"args":[{"name":"keyIndex","type":"u16"},{"name":"faction","type":{"defined":"Faction"}}]}],"accounts":[{"name":"ProfileFactionAccount","docs":["Stores a profiles enlisted faction on-chain."],"type":{"kind":"struct","fields":[{"name":"version","docs":["The data version of this account."],"type":"u8"},{"name":"profile","docs":["The profile this faction enlistment is for."],"type":"publicKey"},{"name":"faction","docs":["The faction of the profile."],"type":"u8"},{"name":"bump","docs":["The bump for this account."],"type":"u8"}]}}],"types":[{"name":"Faction","docs":["A faction that a player can belong to."],"type":{"kind":"enum","variants":[{"name":"Unaligned"},{"name":"MUD"},{"name":"ONI"},{"name":"Ustur"}]}}]}');
    const profileFactionProgramId = new solanaWeb3.PublicKey('pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq');
    const resourceTokens = [{name: 'Carbon', token: 'CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X'},{name: 'Iron Ore', token: 'FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J'},{name: 'Diamond', token: 'DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944'},{name: 'Lumanite', token: 'LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj'},{name: 'Biomass', token: 'MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog'},{name: 'Arco', token: 'ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg'},{name: 'Hydrogen', token: 'HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp'},{name: 'Copper Ore', token: 'CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc'},{name: 'Rochinol', token: 'RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5'}]
    const r4Tokens = [{name: 'Fuel', token: 'fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim'},{name: 'Food', token: 'foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG'},{name: 'Ammo', token: 'ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK'},{name: 'Toolkit', token: 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL'},{name: 'SDU', token: 'SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'}]

    let userPublicKey = null;
    let userProfileAcct = null;
    let userProfileKeyIdx = 0;
    let userProfileFactionAcct = null;
    let userFleetAccts = null;
    let userFleets = [];

    let sageProgram = new BrowserAnchor.anchor.Program(sageIDL, sageProgramId, anchorProvider);
    console.log('sageProgram: ', sageProgram);
    let [sageGameAcct] = await sageProgram.account.game.all();
    console.log('sageGameAcct: ', sageGameAcct);
    let [sageSDUTrackerAcct] = await sageProgram.account.surveyDataUnitTracker.all();
    console.log('sageSDUTrackerAcct: ', sageSDUTrackerAcct);

    let profileProgram = new BrowserAnchor.anchor.Program(profileIDL, profileProgramId, anchorProvider);
    console.log('profileProgram: ', profileProgram);

    let cargoProgram = new BrowserAnchor.anchor.Program(cargoIDL, cargoProgramId, anchorProvider);
    let [cargoStatsDefinitionAcct] = await cargoProgram.account.cargoStatsDefinition.all();
    let cargoStatsDefSeqId = cargoStatsDefinitionAcct.account.seqId;
    console.log('cargoProgram', cargoProgram);
    console.log('cargoStatsDefinitionAcct', cargoStatsDefinitionAcct);

    let seqBN = new BrowserAnchor.anchor.BN(cargoStatsDefSeqId);
    let seqArr = seqBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "be", 2);
    let seq58 = bs58.encode(seqArr);
    let [sduCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM').toBase58(),
            },
        },
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);
    let [repairKitCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: new solanaWeb3.PublicKey('tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL').toBase58(),
            },
        },
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);
    let [fuelCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim').toBase58(),
            },
        },
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);
    let cargoTypes = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);

/*  // Future reference - this retrieves the cargoType size/weight
    for (let cargoType of cargoTypes) {
        let cargoTypeAcct = await solanaConnection.getAccountInfo(cargoType.publicKey);
        let cargoTypeDataExtra = cargoTypeAcct.data.subarray(78);
        let cargoTypeDataExtraBuff = BrowserBuffer.Buffer.Buffer.from(cargoTypeDataExtra);
        let cargoSize = cargoTypeDataExtraBuff.readUIntLE(0, cargoTypeDataExtra.length);
        console.log(`Cargo: ${cargoType.account.mint.toString()}, Size: ${cargoSize}`);
    }
*/
    let [sduTokenFrom] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
        [
            new solanaWeb3.PublicKey('8bBi84Yi7vwSWXSYKDbbHmqnFqqAS41MvPkSEdzFtbsk').toBuffer(),
            new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
            new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM').toBuffer()
        ],
        new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    );

    function createProgramDerivedAccount(derived, derivedFrom1, derivedFrom2) {
        return new Promise(async resolve => {
            const keys = [{
                pubkey: userPublicKey,
                isSigner: true,
                isWritable: true
            }, {
                pubkey: derived,
                isSigner: false,
                isWritable: true
            }, {
                pubkey: derivedFrom1,
                isSigner: false,
                isWritable: false
            }, {
                pubkey: derivedFrom2,
                isSigner: false,
                isWritable: false
            }, {
                pubkey: solanaWeb3.SystemProgram.programId,
                isSigner: false,
                isWritable: false
            }, {
                pubkey: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                isSigner: false,
                isWritable: false
            }];
            let tx = {instruction: new solanaWeb3.TransactionInstruction({
                keys: keys,
                programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                data: []
            })}
            let txResult = await txSignAndSend(tx);
            resolve(txResult);
        });
    }

    function getFleetState(fleetAcctInfo) {
        let remainingData = fleetAcctInfo.data.subarray(414);
        let fleetState = 'Unknown';
        let extra = null;
        switch(remainingData[0]) {
            case 0:
                fleetState = 'StarbaseLoadingBay';
                extra = sageProgram.coder.types.decode('StarbaseLoadingBay', remainingData.subarray(1));
                break;
            case 1: {
                fleetState = 'Idle';
                let sector = sageProgram.coder.types.decode('Idle', remainingData.subarray(1));
                extra = [sector.sector[0].toNumber(), sector.sector[1].toNumber()]
                break;
            }
            case 2:
                fleetState = 'MineAsteroid';
                extra = sageProgram.coder.types.decode('MineAsteroid', remainingData.subarray(1));
                break;
            case 3:
                fleetState = 'MoveWarp';
                extra = sageProgram.coder.types.decode('MoveWarp', remainingData.subarray(1));
                break;
            case 4:
                fleetState = 'MoveSubwarp';
                extra = sageProgram.coder.types.decode('MoveSubwarp', remainingData.subarray(1));
                break;
            case 5:
                fleetState = 'Respawn';
                break;
        }
        return [fleetState, extra];
    }

    function initUser() {
        return new Promise(async resolve => {
            if (typeof solflare === 'undefined') {
                let walletConn = await solana.connect();
                userPublicKey = walletConn.publicKey;
            } else {
                await solflare.connect();
                userPublicKey = solflare.publicKey;
            }

            console.log('getProgramAccountsStart: ', Date.now());
            let userProfiles = await solanaConnection.getProgramAccounts(profileProgramId);
            console.log('getProgramAccountsEnd: ', Date.now());

            let foundProf = [];
            console.log(userProfiles[0]);
            for (let userProf of userProfiles) {
                let userProfData = userProf.account.data.subarray(30);
                let iter = 0;
                while (userProfData.length >= 80) {
                    let currProf = userProfData.subarray(0, 80);
                    let profDecoded = profileProgram.coder.types.decode('ProfileKey', currProf);
                    if (profDecoded.key.toString() === userPublicKey.toString()) {
                        let [playerNameAcct] = await solanaConnection.getProgramAccounts(
                            profileProgramId,
                            {
                                filters: [
                                    {
                                        memcmp: {
                                            offset: 9,
                                            bytes: userProf.pubkey.toString(),
                                        },
                                    },
                                ],
                            }
                        );
                        let playerName = playerNameAcct ? new TextDecoder().decode(playerNameAcct.account.data.subarray(42)) : '';
                        foundProf.push({profile: userProf.pubkey.toString(), name: playerName, idx: iter})
                    }
                    userProfData = userProfData.subarray(80);
                    //iter > 0 && foundProf.push({profile: userProf, key: profDecoded, idx: iter});
                    iter += 1;
                }
            }

            let userProfile = foundProf.length > 1 ? await assistProfileToggle(foundProf) : foundProf[0];
            userProfileAcct = new solanaWeb3.PublicKey(userProfile.profile);
            userProfileKeyIdx = userProfile.idx;

            /*
            function getUserProfileAcct(procId, roomId, sessionId) {
                return new Promise((resolve) => {
                    let autoWS = new WebSocket(`wss://starcomm-mp.staratlas.com/${procId}/${roomId}?sessionId=${sessionId}`);
                    autoWS.binaryType = 'arraybuffer';
                    autoWS.onmessage = (event) => {
                        let tempArr = Array.from(new Uint8Array(event.data))
                        if (tempArr[0] === 14) {
                            let tempSlice = new Uint8Array(tempArr.slice(9,52));
                            userProfileAcct = new solanaWeb3.PublicKey(new TextDecoder().decode(tempSlice));
                            autoWS.close();
                            resolve();
                        }
                    };
                    autoWS.onopen = (event) => {
                        let initData = new Uint8Array(1);
                        initData[0] = 10;
                        autoWS.send(initData);
                    };
                });
            }

            let sageRoom = await fetch("https://starcomm-mp.staratlas.com/matchmake/joinOrCreate/Sage_Account_Room", {
                "headers": {
                    "accept": "application/json",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                },
                "referrerPolicy": "no-referrer",
                "body": `{"playerPublicKey":"${userPublicKey.toBase58()}"}`,
                "method": "POST",
                "mode": "cors",
                "credentials": "omit"
            });
            let sageRoomJson = await sageRoom.json();
            await getUserProfileAcct(sageRoomJson.room.processId, sageRoomJson.room.roomId, sageRoomJson.sessionId);
            */

            let profileFactionProgram = new BrowserAnchor.anchor.Program(profileFactionIDL, profileFactionProgramId, anchorProvider);
            [userProfileFactionAcct] = await profileFactionProgram.account.profileFactionAccount.all([
                {
                    memcmp: {
                        offset: 9,
                        bytes: userProfileAcct.toBase58(),
                    },
                },
            ]);

            userFleetAccts = await sageProgram.account.fleet.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: userProfileAcct.toBase58(),
                    },
                },
            ]);
            console.log(userFleetAccts);

            for (let fleet of userFleetAccts) {
                let fleetLabel = new TextDecoder("utf-8").decode(new Uint8Array(fleet.account.fleetLabel));
                let [fleetRepairKitToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                    [
                        fleet.account.cargoHold.toBuffer(),
                        new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                        new solanaWeb3.PublicKey('tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL').toBuffer()
                    ],
                    new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
                );
                let [fleetSduToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                    [
                        fleet.account.cargoHold.toBuffer(),
                        new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                        new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM').toBuffer()
                    ],
                    new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
                );
                let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                    [
                        fleet.account.fuelTank.toBuffer(),
                        new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                        new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim').toBuffer()
                    ],
                    new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
                );
                let fleetSavedData = await GM.getValue(fleet.publicKey.toString(), '{}');
                let fleetParsedData = JSON.parse(fleetSavedData);
                let fleetDest = fleetParsedData && fleetParsedData.dest ? fleetParsedData.dest : '';
                let fleetScanBlock = fleetParsedData && fleetParsedData.scanBlock ? fleetParsedData.scanBlock : [];
                let fleetScanMin = fleetParsedData && fleetParsedData.scanMin ? fleetParsedData.scanMin : 10;
                let fleetScanMove = fleetParsedData && fleetParsedData.scanMove == 'false' ? 'false' : 'true';
                let fleetMineResource = fleetParsedData && fleetParsedData.mineResource ? fleetParsedData.mineResource : '';
                let fleetStarbase = fleetParsedData && fleetParsedData.starbase ? fleetParsedData.starbase : '';
                let fleetMoveType = fleetParsedData && fleetParsedData.moveType ? fleetParsedData.moveType : 'warp';
                let fleetMoveTarget = fleetParsedData && fleetParsedData.moveTarget ? fleetParsedData.moveTarget : '';
                await solanaConnection.getAccountInfo(fleetSduToken) || await createProgramDerivedAccount(fleetSduToken, fleet.account.cargoHold, new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'));
                await solanaConnection.getAccountInfo(fleetRepairKitToken) || await createProgramDerivedAccount(fleetRepairKitToken, fleet.account.cargoHold, new solanaWeb3.PublicKey('tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL'));
                await solanaConnection.getAccountInfo(fleetFuelToken) || await createProgramDerivedAccount(fleetFuelToken, fleet.account.fuelTank, new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim'));
                let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                let currentToolCnt = fleetCurrentCargo.value.find(item => item.pubkey.toString() === fleetRepairKitToken.toString());
                let fleetCurrentFuel = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                let currentFuelCnt = fleetCurrentFuel.value.find(item => item.pubkey.toString() === fleetFuelToken.toString());
                let fleetAcctInfo = await solanaConnection.getAccountInfo(fleet.publicKey);
                let [fleetState, extra] = getFleetState(fleetAcctInfo);
                let fleetCoords = fleetState == 'Idle' && extra ? extra : [];
                let fleetScanBlockIdx = 0;
                for (let i = 0; i < fleetScanBlock.length; i++) {
                    if (fleetCoords[0] == fleetScanBlock[i][0] && fleetCoords[1] == fleetScanBlock[i][1]) {
                        fleetScanBlockIdx = i;
                        break;
                    }
                }
                userFleets.push({publicKey: fleet.publicKey, label: fleetLabel.replace(/\0/g, ''), state: fleetState, moveTarget: fleetMoveTarget, startingCoords: fleetCoords, cargoHold: fleet.account.cargoHold, fuelTank: fleet.account.fuelTank, ammoBank: fleet.account.ammoBank, repairKitToken: fleetRepairKitToken, sduToken: fleetSduToken, fuelToken: fleetFuelToken, warpFuelConsumptionRate: fleet.account.stats.movementStats.warpFuelConsumptionRate, warpSpeed: fleet.account.stats.movementStats.warpSpeed, maxWarpDistance: fleet.account.stats.movementStats.maxWarpDistance, subwarpFuelConsumptionRate: fleet.account.stats.movementStats.subwarpFuelConsumptionRate, subwarpSpeed: fleet.account.stats.movementStats.subwarpSpeed, cargoCapacity: fleet.account.stats.cargoStats.cargoCapacity, fuelCapacity: fleet.account.stats.cargoStats.fuelCapacity, ammoCapacity: fleet.account.stats.cargoStats.ammoCapacity, scanCost: fleet.account.stats.miscStats.scanRepairKitAmount, scanCooldown: fleet.account.stats.miscStats.scanCoolDown, warpCooldown: fleet.account.stats.movementStats.warpCoolDown, miningRate: fleet.account.stats.cargoStats.miningRate, foodConsumptionRate: fleet.account.stats.cargoStats.foodConsumptionRate, ammoConsumptionRate: fleet.account.stats.cargoStats.ammoConsumptionRate, planetExitFuelAmount: fleet.account.stats.movementStats.planetExitFuelAmount, destCoord: fleetDest, starbaseCoord: fleetStarbase, scanBlock: fleetScanBlock, scanBlockIdx: fleetScanBlockIdx, scanEnd: 0, scanSkipCnt: 0, scanSectorStart: 0, scanMin: fleetScanMin, scanMove: fleetScanMove, toolCnt: currentToolCnt.account.data.parsed.info.tokenAmount.uiAmount, sduCnt: 0, fuelCnt: currentFuelCnt.account.data.parsed.info.tokenAmount.uiAmount, moveType: fleetMoveType, mineResource: fleetMineResource, minePlanet: null});
            }
            userFleets.sort(function (a, b) {
                return a.label.toUpperCase().localeCompare(b.label.toUpperCase());
            });
            initComplete = true;
            resolve();
        });
    }

    function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    function getBalanceChange(txResult, targetAcct) {
        let acctIdx = txResult.transaction.message.staticAccountKeys.findIndex(item => item.toString() === targetAcct);
        let preBalanceObj = txResult.meta.preTokenBalances.find(item => item.accountIndex === acctIdx);
        let preBalance = preBalanceObj && preBalanceObj.uiTokenAmount && preBalanceObj.uiTokenAmount.uiAmount ? preBalanceObj.uiTokenAmount.uiAmount : 0;
        let postBalanceObj = txResult.meta.postTokenBalances.find(item => item.accountIndex === acctIdx);
        let postBalance = postBalanceObj && postBalanceObj.uiTokenAmount && postBalanceObj.uiTokenAmount.uiAmount ? postBalanceObj.uiTokenAmount.uiAmount : 0;
        return {preBalance: preBalance, postBalance: postBalance}
    }

    // Extracted from SAGE Labs, keep for future reference
    function getTokenBalanceChanges(br, targetAcct) {
        const gr = {};
        if (br.meta && br.meta.preTokenBalances && br.meta.postTokenBalances) {
            for (const _r of br.meta.preTokenBalances) {
                const vr = br.transaction.message.staticAccountKeys[_r.accountIndex]
                , Sr = _r.uiTokenAmount.uiAmount ?? 0;
                gr[vr.toString()] = Sr
            }
            for (const _r of br.meta.postTokenBalances) {
                const vr = br.transaction.message.staticAccountKeys[_r.accountIndex]
                , wr = (_r.uiTokenAmount.uiAmount ?? 0) - gr[vr.toString()];
                gr[vr.toString()] = wr
            }
        }
        return gr
    }

    function calculateMovementDistance(orig, dest) {
        return dest ? Math.sqrt((orig[0] - dest[0]) ** 2 + (orig[1] - dest[1]) ** 2) : 0
    }

    function calculateWarpTime(fleet, distance) {
        return fleet.warpSpeed > 0 ? distance / (fleet.warpSpeed / 1e6) : 0
    }

    function calculateWarpFuelBurn(fleet, distance) {
        return distance * (fleet.warpFuelConsumptionRate / 100)
    }

    function calculateSubwarpTime(fleet, distance) {
        return fleet.subwarpSpeed > 0 ? distance / (fleet.subwarpSpeed / 1e6) : 0
    }

    function calculateSubwarpFuelBurn(fleet, distance) {
        return distance * (fleet.subwarpFuelConsumptionRate / 100)
    }

    function calculateMiningDuration(cargoCapacity, miningRate, resourceHardness, systemRichness) {
        return resourceHardness > 0 ? Math.ceil(cargoCapacity / (((miningRate / 10000) * (systemRichness / 100)) / (resourceHardness / 100))) : 0;
    }

    async function getStarbaseFromCoords(x, y) {
        return new Promise(async resolve => {
            let xBN = new BrowserAnchor.anchor.BN(x);
            let xArr = xBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let x58 = bs58.encode(xArr);
            let yBN = new BrowserAnchor.anchor.BN(y);
            let yArr = yBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let y58 = bs58.encode(yArr);
            let [starbase] = await sageProgram.account.starbase.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: x58
                    }
                },
                {
                    memcmp: {
                        offset: 49,
                        bytes: y58
                    }
                },
            ]);
            resolve(starbase);
        });
    }

    async function getPlanetsFromCoords(x, y) {
        return new Promise(async resolve => {
            let xBN = new BrowserAnchor.anchor.BN(x);
            let xArr = xBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let x58 = bs58.encode(xArr);
            let yBN = new BrowserAnchor.anchor.BN(y);
            let yArr = yBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let y58 = bs58.encode(yArr);
            let planets = await sageProgram.account.planet.all([
                {
                    memcmp: {
                        offset: 105,
                        bytes: x58
                    }
                },
                {
                    memcmp: {
                        offset: 113,
                        bytes: y58
                    }
                },
            ]);
            resolve(planets);
        });
    }

    async function getStarbasePlayer(userProfile, starbase) {
        return new Promise(async resolve => {
            let [starbasePlayer] = await sageProgram.account.starbasePlayer.all([
                {
                    memcmp: {
                        offset: 9,
                        bytes: userProfile.toBase58()
                    }
                },
                {
                    memcmp: {
                        offset: 73,
                        bytes: starbase.toBase58()
                    }
                },
            ]);
            resolve(starbasePlayer);
        });
    }

    async function getFleetCntAtCoords() {
        let gridSizeElem = document.querySelector('#fleetGridSelect');
        let gridSize = gridSizeElem.value;
        let targetCoordsElem = document.querySelector('#checkFleetCntInput');
        let targetCoords = targetCoordsElem.value;
        let fleetGrid = document.querySelector('#fleetGrid');
        let loadingMessage = document.querySelector('#loadingMessage');
        if (!targetCoords || targetCoords.trim() === '') {
            loadingMessage.innerText = 'Please enter target coordinates for grid center.';
            loadingMessage.style.display = 'block';
            fleetGrid.style.display = 'none';
            return;// Stop further processing since input is empty or idle
        }
        let [x, y] = targetCoords.split(',').map(coord => parseInt(coord.trim()));

        fleetGrid.innerHTML = ''; // Clear previous results

        try {
            loadingMessage.innerText = 'Loading...';
            loadingMessage.style.display = 'block';
            fleetGrid.style.display = 'none';

            for (let i = 0; i < gridSize; i++) {
                let row = fleetGrid.insertRow();
                for (let j = 0; j < gridSize; j++) {
                    let coordX = x + j - Math.floor(gridSize / 2);// Adjusted for column-first population
                    let coordY = y + (gridSize-1) - i - Math.floor(gridSize / 2);// Adjusted for descending y value

                    let xBN = new BrowserAnchor.anchor.BN(coordX);
                    let xArr = xBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, 'le', 8);
                    let x58 = bs58.encode(xArr);

                    let yBN = new BrowserAnchor.anchor.BN(coordY);
                    let yArr = yBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, 'le', 8);
                    let y58 = bs58.encode(yArr);

                    let fleetAccts = await solanaConnection.getProgramAccounts(sageProgramId, {
                        filters: [
                            { memcmp: { offset: 415, bytes: x58 } },
                            { memcmp: { offset: 423, bytes: y58 } },
                        ],
                    });

                    let cell = row.insertCell(j);
                    // Create a div to hold the content for formatting
                    let contentDiv = document.createElement('div');
                    contentDiv.style.textAlign = 'center';

                    // Set the content of the div (coordinates and fleet count)
                    contentDiv.innerHTML = `<div>[${coordX},${coordY}]</div><div>${fleetAccts.length}</div>`;

                    // Calculate gradient color based on fleetAccts.length
                    const gradientColor = calculateGradientColor(fleetAccts.length);

                    // Apply background gradient
                    cell.style.background = gradientColor;

                    // Apply border style
                    cell.style.border = '2px solid rgb(255, 190, 77)';
                    cell.style.borderRadius = '8px';
                    cell.style.padding = '9px'; // Adjust padding to maintain inner content space
                    cell.style.position = 'relative';

                    // Append the content div to the cell
                    cell.appendChild(contentDiv);

                    // Add a green Unicode circle if fleet count is below 5
                    if (fleetAccts.length < 5) {
                        const greenCircle = document.createElement('div');
                        greenCircle.style.position = 'absolute';
                        greenCircle.style.bottom = '-3px';
                        greenCircle.style.right = '0px';
                        greenCircle.style.fontSize = '20px';
                        greenCircle.innerHTML = '&#9679;'; // Unicode circle
                        greenCircle.style.color = 'rgb(0, 255, 0, 1)';
                        greenCircle.style.opacity = '1.0';
                        cell.appendChild(greenCircle);
                    }

                    // Function to calculate gradient color
                    function calculateGradientColor(fleetCount) {
                        const maxFleetCount = 25; // Maximum fleet count for the hottest color
                        const minFleetCount = 0; // Minimum fleet count for the coolest color

                        // Map the fleet count to an RGB value (blue to red gradient)
                        const r = Math.floor((fleetCount / maxFleetCount) * 255);
                        const g = 0;
                        const b = Math.floor(((maxFleetCount - fleetCount) / maxFleetCount) * 255);

                        // Calculate the gradient direction based on fleet count (0 degrees for cool to 90 degrees for hot)
                        const gradientDirection = 0 + (fleetCount / maxFleetCount) * 90;

                        // Adjust the gradient direction by 180 degrees to place it at the bottom
                        const adjustedGradientDirection = gradientDirection - 45;

                        // Construct the gradient CSS with stops from 0% to 50% for the color and 50% to 100% for transparent
                        return `linear-gradient(${adjustedGradientDirection}deg, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(${r}, ${g}, ${b}, 0) 50%, rgba(${r}, ${g}, ${b}, 0) 100%)`;
                    }
                }
            }

            loadingMessage.style.display = 'none';
            fleetGrid.style.display = 'block';
            //resultDiv.appendChild(fleetGrid);

        } catch (error) {
            console.error('Error fetching fleet information:', error);
            loadingMessage.innerText = 'Error fetching fleet information';
        }
    }

    async function sendAndConfirmTx(txSerialized, lastValidBlockHeight, txHash) {
        //return new Promise(async resolve => {
        let {blockHeight: curBlockHeight} = await solanaConnection.getEpochInfo({ commitment: 'confirmed' });
        let interimBlockHeight = curBlockHeight;
        if (curBlockHeight > lastValidBlockHeight) return {txHash, confirmation: {name: 'TransactionExpiredBlockheightExceededError'}};
        txHash = await solanaConnection.sendRawTransaction(txSerialized, {skipPreflight: true, maxRetries: 0, preflightCommitment: 'confirmed'});
        console.log('txHash: ', txHash);
        console.log('blockDiff: ', curBlockHeight - lastValidBlockHeight);
        let confirmed = false;
        //console.log('--LOOP START--')
        while ((curBlockHeight - interimBlockHeight) < 10) {
            let epochInfo = await solanaConnection.getEpochInfo({ commitment: 'confirmed' });
            curBlockHeight = epochInfo.blockHeight;
            //console.log('curBlockHeight: ', curBlockHeight);
            //console.log('interimBlockHeight: ', interimBlockHeight);
            //console.log('lastValidBlockHeight: ', lastValidBlockHeight);
            const signatureStatus = await solanaConnection.getSignatureStatus(txHash);
            //console.log('signatureStatus: ', signatureStatus);
            //signatureStatus.value && console.log(['confirmed','finalized'].includes(signatureStatus.value.confirmationStatus));
            if (signatureStatus.value && ['confirmed','finalized'].includes(signatureStatus.value.confirmationStatus)) {
                return {txHash, confirmation: signatureStatus};
            } else if (signatureStatus.err) {
                console.log('returning error: ', signatureStatus.err);
                return {txHash, confirmation: signatureStatus}
            }
            await wait(200);
        }
        //console.log('--LOOP END--')
        return await sendAndConfirmTx(txSerialized, lastValidBlockHeight, txHash);
        //});
    }

    function waitForTxConfirmation(txHash) {
        return new Promise(async resolve => {
            let response = null;
            try {
                let latestBH = await solanaConnection.getLatestBlockhash('confirmed');
                let confirmation = await solanaConnection.confirmTransaction({
                    blockhash: latestBH.blockhash,
                    lastValidBlockHeight: latestBH.lastValidBlockHeight,
                    signature: txHash
                }, 'confirmed');
                response = confirmation;
                /*
                console.log(confirmation);
                let curBlockHeight = await solanaConnection.getEpochInfo().blockHeight;
                while (curBlockHeight < latestBH.lastValidBlockHeight && response !== 'confirmed') {
                    console.log('Fallback confirmation check');
                    response = 'confirmed';
                    await wait(1000);
                }
                */
            } catch (err) {
                console.log('ERROR: ', err);
                console.log('ERROR NAME: ', err.name);
                response = err;
            }
            resolve(response);
        });
    }

    function txSignAndSend(ix) {
        return new Promise(async resolve => {
            let tx = new solanaWeb3.Transaction();
            if (priorityFee > 0) tx.add(solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({microLamports: priorityFee}));
            console.log('---INSTRUCTION---');
            console.log(ix);

            if (ix.constructor === Array) {
                ix.forEach(item => tx.add(item.instruction))
            } else {
                tx.add(ix.instruction);
            }

            let latestBH = await solanaConnection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = latestBH.blockhash;
            tx.lastValidBlockHeight = latestBH.lastValidBlockHeight-150;
            tx.feePayer = userPublicKey;
            tx.signer = userPublicKey;
            let txSigned = null;
            if (typeof solflare === 'undefined') {
                txSigned = await solana.signAllTransactions([tx]);
            } else {
                txSigned = await solflare.signAllTransactions([tx]);
            }
            let txSerialized = txSigned[0].serialize();
            // add error handling - net::ERR_FAILED 504 - Uncaught (in promise) TypeError: Failed to fetch
            //let txHash = await solanaConnection.sendRawTransaction(txSerialized, {skipPreflight: true, preflightCommitment: 'confirmed'});
            //console.log('---TXHASH---');
            //console.log(txHash);
            //let confirmation = await waitForTxConfirmation(txHash);
            //console.log('---CONFIRMATION---');
            //console.log(confirmation);
            //let {blockHeight: initBlockHeight} = await solanaConnection.getEpochInfo({ commitment: 'confirmed' });
            let txStartTS = Date.now();
            let response = await sendAndConfirmTx(txSerialized, tx.lastValidBlockHeight, null);
            console.log('txResponse: ', response);
            let txHash = response.txHash;
            let confirmation = response.confirmation;
            let txResult = await solanaConnection.getTransaction(txHash, {commitment: 'confirmed', preflightCommitment: 'confirmed', maxSupportedTransactionVersion: 1});
            //let priorityHistory = await solanaConnection.getRecentPrioritizationFees();
            //console.log('priorityHistory: ', priorityHistory);
            if (confirmation.name == 'TransactionExpiredBlockheightExceededError' && !txResult) {
                console.log('-----RETRY-----');
                txResult = await txSignAndSend(ix);
            }
            if (!confirmation.name) {
                while (!txResult) {
                    await wait(2000);
                    txResult = await solanaConnection.getTransaction(txHash, {commitment: 'confirmed', preflightCommitment: 'confirmed', maxSupportedTransactionVersion: 1});
                }
            }
            let txEndTS = Date.now();
            console.log('Time (ms): ', txEndTS - txStartTS);
            console.log('txResult: ', txResult);
            resolve(txResult);
        });
    }

    //bitshift taken from @staratlas/sage permissions.ts
    function buildPermissions(input) {
        const out = [0,0,0,0,0,0,0,0];
        out[0] = new BrowserAnchor.anchor.BN(
            (input[0][0] ? 1 << 0 : 0) |
            (input[0][1] ? 1 << 1 : 0) |
            (input[0][2] ? 1 << 2 : 0) |
            (input[0][3] ? 1 << 3 : 0) |
            (input[0][4] ? 1 << 4 : 0) |
            (input[0][5] ? 1 << 5 : 0) |
            (input[0][6] ? 1 << 6 : 0) |
            (input[0][7] ? 1 << 7 : 0));
        out[1] = new BrowserAnchor.anchor.BN(
            (input[1][0] ? 1 << 0 : 0) |
            (input[1][1] ? 1 << 1 : 0) |
            (input[1][2] ? 1 << 2 : 0) |
            (input[1][3] ? 1 << 3 : 0) |
            (input[1][4] ? 1 << 4 : 0) |
            (input[1][5] ? 1 << 5 : 0) |
            (input[1][6] ? 1 << 6 : 0) |
            (input[1][7] ? 1 << 7 : 0));
        out[2] = new BrowserAnchor.anchor.BN(
            (input[2][0] ? 1 << 0 : 0) |
            (input[2][1] ? 1 << 1 : 0) |
            (input[2][2] ? 1 << 2 : 0) |
            (input[2][3] ? 1 << 3 : 0) |
            (input[2][4] ? 1 << 4 : 0) |
            (input[2][5] ? 1 << 5 : 0) |
            (input[2][6] ? 1 << 6 : 0) |
            (input[2][7] ? 1 << 7 : 0));
        console.log('out: ', out);
        return out;
    }

    async function addKeyToProfile(newKey) {
        return new Promise(async resolve => {
            let permissions = buildPermissions([[true,true,true,true,true,true,true,true],[true,true,true,true,true,true,true,true],[true,true,true,true,true,true,true,true]]);
            //let permissions = buildPermissions([[true,false,false,false,false,false,false,false],[false,false,true,true,true,false,false,true],[true,false,true,true,true,false,true,true]]);
            /*
            let keys = [{key: 'newKey', expireTime: new BrowserAnchor.anchor.BN(-1), permissions: permissions}];
            let tempKeys = keys.map(
              (key) => ({
                sageProgramId,
                expireTime:
                  key.expireTime,
                permissions: key.permissions,
              }),
            )
            */
            let txResult = {};
            if (newKey.length > 0) {
                let tx = { instruction: await profileProgram.methods.addKeys(0, 0, [{
                    scope: sageProgramId,
                    expireTime: new BrowserAnchor.anchor.BN(-1),
                    permissions: permissions
                }]).accountsStrict({
                    funder: userPublicKey,
                    profile: userProfileAcct,
                    key: userPublicKey,
                    systemProgram: solanaWeb3.SystemProgram.programId
                }).remainingAccounts([{
                    pubkey: new solanaWeb3.PublicKey(newKey),
                    isSigner: false,
                    isWritable: false
                }]).instruction()}
                txResult = await txSignAndSend(tx);
            } else {
                txResult = {name: "InputNeeded"};
            }
            resolve(txResult);
        });
    }

    async function removeKeyFromProfile() {
        return new Promise(async resolve => {
            let tx = { instruction: await profileProgram.methods.removeKeys(0, [new BrowserAnchor.anchor.BN(1), new BrowserAnchor.anchor.BN(2)]).accountsStrict({
                funder: userPublicKey,
                profile: userProfileAcct,
                key: userPublicKey,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).instruction()}
            let txResult = await txSignAndSend(tx);
            resolve(txResult);
        });
    }

    async function execScan(fleet) {
        return new Promise(async resolve => {
            // FIX: need to figure out how to initialize fleet.sduToken
            //      look for await gr.getAccountInfo(Br) || (Rr.push(srcExports$2.createAssociatedTokenAccount(qr, Qr, !0).instructions)
            let tx = { instruction: await sageProgram.methods.scanForSurveyDataUnits({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx)}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey, // sageProgram.fleet.publicKey
                            owningProfile: userProfileAcct, // from API
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey // wallet.publicKey
                        },
                        gameId: sageGameAcct.publicKey // sageProgram.game.publicKey
                    },
                    gameState: sageGameAcct.account.gameState // sageProgram.game.gameState
                },
                surveyDataUnitTracker: sageSDUTrackerAcct.publicKey, // sageProgram.SurveyDataUnitTracker.publicKey
                surveyDataUnitTrackerSigner: sageSDUTrackerAcct.account.signer, // sageProgram.SurveyDataUnitTracker.signer
                cargoHold: fleet.cargoHold, // sageProgram.fleet.cargoHold
                sduCargoType: sduCargoTypeAcct.publicKey, // cargoProgram.cargoType - memcmp offset 41 'SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'
                repairKitCargoType: repairKitCargoTypeAcct.publicKey, // cargoProgram.cargoType - memcmp offset 41 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL'
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition, // sageProgram.game.cargo
                sduTokenFrom: sduTokenFrom, // calculated
                sduTokenTo: fleet.sduToken,
                repairKitTokenFrom: fleet.repairKitToken,
                repairKitMint: sageGameAcct.account.mints.repairKit, // sageProgram.game.repairKit
                cargoProgram: new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'), // static
                tokenProgram: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // static
                recentSlothashes: new solanaWeb3.PublicKey('SysvarS1otHashes111111111111111111111111111'), // static
                instructionsSysvar: new solanaWeb3.PublicKey('Sysvar1nstructions1111111111111111111111111') // static
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execSubwarp(fleet, destX, destY) {
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.startSubwarp({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
            })/*.remainingAccounts([
                {
                    pubkey: userProfileAcct,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleet.fuelTank,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fuelCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.account.cargo.statsDefinition,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleet.fuelToken,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.fuel,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.gameState,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'),
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    isSigner: false,
                    isWritable: false
                },
            ])*/.instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execExitSubwarp(fleet) {
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
                fleet: fleet.publicKey
            }).remainingAccounts([
                {
                    pubkey: userProfileAcct,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleet.fuelTank,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fuelCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.account.cargo.statsDefinition,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleet.fuelToken,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.fuel,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.gameState,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'),
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    isSigner: false,
                    isWritable: false
                },
            ]).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execWarp(fleet, destX, destY) {
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.warpToCoordinate({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                fuelTank: fleet.fuelTank,
                cargoType: fuelCargoTypeAcct.publicKey,
                statsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: fleet.fuelToken,
                tokenMint: sageGameAcct.account.mints.fuel,
                cargoProgram: new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'),
                tokenProgram: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execExitWarp(fleet) {
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
                fleet: fleet.publicKey
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execDock(fleet, dockCoords) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let tx = { instruction: await sageProgram.methods.idleToLoadingBay(new BrowserAnchor.anchor.BN(userProfileKeyIdx)).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                }
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execUndock(fleet, dockCoords) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let tx = { instruction: await sageProgram.methods.loadingBayToIdle(new BrowserAnchor.anchor.BN(userProfileKeyIdx)).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                }
            }).remainingAccounts([{
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            }]).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execCreateCargoPod(fleet, dockCoords) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let cargoPodData = {
                keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx),
                podSeeds: Array.from(solanaWeb3.Keypair.generate().publicKey.toBuffer())
            }

            let [cargoPod] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    BrowserBuffer.Buffer.Buffer.from("cargo_pod"),
					BrowserBuffer.Buffer.Buffer.from(cargoPodData.podSeeds),
                ],
                sageProgramId
            );

            let tx = { instruction: await sageProgram.methods.createCargoPod(cargoPodData).accountsStrict({
                funder: userPublicKey,
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                gameAccountsAndProfile: {
                    gameAndProfileAndFaction: {
                        key: userPublicKey,
                        profile: userProfileAcct,
                        profileFaction: userProfileFactionAcct.publicKey,
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                cargoPod: cargoPod,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                cargoProgram: cargoProgramId,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).instruction().signers([userPublicKey])}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(cargoPod);
        });
    }

    async function execCargoFromFleetToStarbase(fleet, fleetCargoPod, tokenMint, dockCoords, amount) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let starbasePlayerCargoHolds = await cargoProgram.account.cargoPod.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: starbasePlayer.publicKey.toBase58(),
                    },
                },
            ]);
            let starbasePlayerCargoHold = starbasePlayerCargoHolds.find(item => item.account.openTokenAccounts > 0);
            starbasePlayerCargoHold = starbasePlayerCargoHold ? starbasePlayerCargoHold : starbasePlayerCargoHolds.length > 0 ? starbasePlayerCargoHolds[0] : await execCreateCargoPod(fleet, dockCoords);
            let [starbaseCargoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    starbasePlayerCargoHold.publicKey.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey(tokenMint).toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleetCargoPod.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey(tokenMint).toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let fleetCurrentPod = await solanaConnection.getParsedTokenAccountsByOwner(fleetCargoPod, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let currentResource = fleetCurrentPod.value.find(item => item.account.data.parsed.info.mint === tokenMint);
            let fleetResourceAcct = currentResource ? currentResource.pubkey : fleetResourceToken;
            let resourceCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == tokenMint);
            await solanaConnection.getAccountInfo(starbaseCargoToken) || await createProgramDerivedAccount(starbaseCargoToken, starbasePlayerCargoHold.publicKey, new solanaWeb3.PublicKey(tokenMint));
            let tx = { instruction: await sageProgram.methods.withdrawCargoFromFleet({ amount: new BrowserAnchor.anchor.BN(amount), keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx) }).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                cargoPodFrom: fleetCargoPod, // fleet.cargoHold,
                cargoPodTo: starbasePlayerCargoHold.publicKey,
                cargoType: resourceCargoTypeAcct.publicKey,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: fleetResourceAcct,
                tokenTo: starbaseCargoToken,
                tokenMint: tokenMint,
                fundsTo: userPublicKey,
                cargoProgram: cargoProgramId,
                tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            }).remainingAccounts([{
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            }]).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execCargoFromStarbaseToFleet(fleet, cargoPodTo, tokenTo, tokenMint, cargoType, dockCoords, amount) {
        return new Promise(async resolve => {
            await solanaConnection.getAccountInfo(tokenTo) || await createProgramDerivedAccount(tokenTo, cargoPodTo, new solanaWeb3.PublicKey(tokenMint));
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let starbasePlayerCargoHolds = await cargoProgram.account.cargoPod.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: starbasePlayer.publicKey.toBase58(),
                    },
                },
            ]);
            let starbasePlayerCargoHold = starbasePlayerCargoHolds[0];
            let mostFound = 0;
            for (let cargoHold of starbasePlayerCargoHolds) {
                if (cargoHold.account && cargoHold.account.openTokenAccounts > 0) {
                    let cargoHoldTokens = await solanaConnection.getParsedTokenAccountsByOwner(cargoHold.publicKey, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let cargoHoldFound = cargoHoldTokens.value.find(item => item.account.data.parsed.info.mint === tokenMint && item.account.data.parsed.info.tokenAmount.uiAmount >= amount);
                    if (cargoHoldFound) {
                        starbasePlayerCargoHold = cargoHold;
                        mostFound = cargoHoldFound.account.data.parsed.info.tokenAmount.uiAmount;
                        break;
                    } else {
                        let cargoHoldFound = cargoHoldTokens.value.find(item => item.account.data.parsed.info.mint === tokenMint && item.account.data.parsed.info.tokenAmount.uiAmount >= mostFound);
                        if (cargoHoldFound) {
                            starbasePlayerCargoHold = cargoHold;
                            mostFound = cargoHoldFound.account.data.parsed.info.tokenAmount.uiAmount;
                        }
                    }
                }
            }
            amount = amount > mostFound ? mostFound : amount;
            let [starbaseCargoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    starbasePlayerCargoHold.publicKey.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey(tokenMint).toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            await solanaConnection.getAccountInfo(starbaseCargoToken) || await createProgramDerivedAccount(starbaseCargoToken, starbasePlayerCargoHold.publicKey, new solanaWeb3.PublicKey(tokenMint));
            let tx = { instruction: await sageProgram.methods.depositCargoToFleet({ amount: new BrowserAnchor.anchor.BN(amount), keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx) }).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                fundsTo: userPublicKey,
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                cargoPodFrom: starbasePlayerCargoHold.publicKey,
                cargoPodTo: cargoPodTo,
                cargoType: cargoType.publicKey,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: starbaseCargoToken,
                tokenTo: tokenTo,
                tokenMint: tokenMint,
                cargoProgram: cargoProgramId,
                tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            }).remainingAccounts([{
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            }]).instruction()}
            let txResult = {};
            if (amount > 0) {
                fleet.busy = true;
                txResult = await txSignAndSend(tx);
                fleet.busy = false;
            } else {
                txResult = {name: "NotEnoughResource"};
            }
            let [fleetRepairKitToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey('tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL').toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let [fleetSduToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM').toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.fuelTank.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim').toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            await solanaConnection.getAccountInfo(fleetSduToken) || await createProgramDerivedAccount(fleetSduToken, fleet.cargoHold, new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'));
            await solanaConnection.getAccountInfo(fleetRepairKitToken) || await createProgramDerivedAccount(fleetRepairKitToken, fleet.cargoHold, new solanaWeb3.PublicKey('tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL'));
            await solanaConnection.getAccountInfo(fleetFuelToken) || await createProgramDerivedAccount(fleetFuelToken, fleet.fuelTank, new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim'));
            var userFleetIndex = userFleets.findIndex(item => {return item.publicKey === fleet.publicKey});
            userFleets[userFleetIndex].sduToken = fleetSduToken;
            userFleets[userFleetIndex].repairKitToken = fleetRepairKitToken;
            userFleets[userFleetIndex].fuelToken = fleetFuelToken;
            resolve(txResult);
        });
    }

    async function execStartMining(fleet, mineItem, sageResource, planet) {
        return new Promise(async resolve => {
            let resourceToken = fleet.mineResource;
            let targetX = fleet.destCoord.split(',')[0].trim();
            let targetY = fleet.destCoord.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(targetX, targetY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let tx = { instruction: await sageProgram.methods.startMiningAsteroid({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx)}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                mineItem : mineItem.publicKey,
                resource: sageResource.publicKey,
                planet: planet.publicKey,
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execStopMining(fleet, sageResource, sageResourceAcctInfo, mineItem, resourceToken) {
        return new Promise(async resolve => {
            let planet = sageResourceAcctInfo.location;
            let targetX = fleet.destCoord.split(',')[0].trim();
            let targetY = fleet.destCoord.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(targetX, targetY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);

            let [planetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    mineItem.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    resourceToken.toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                   resourceToken.toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let [fleetFoodToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    sageGameAcct.account.mints.food.toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let [fleetAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.ammoBank.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    sageGameAcct.account.mints.ammo.toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let currentFood = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.food.toString());
            let fleetFoodAcct = currentFood ? currentFood.pubkey : fleetFoodToken;

            let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.ammoBank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
            let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
            await solanaConnection.getAccountInfo(fleetAmmoAcct) || await createProgramDerivedAccount(fleetAmmoAcct, fleet.ammoBank, sageGameAcct.account.mints.ammo);

            await solanaConnection.getAccountInfo(fleetResourceToken) || await createProgramDerivedAccount(fleetResourceToken, fleet.cargoHold, resourceToken);
            let foodCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.food);
            let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
            let resourceCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resourceToken.toString());
            let tx1 = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
                fleet: fleet.publicKey
            }).remainingAccounts([
                {
                    pubkey: userProfileFactionAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleet.cargoHold,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleet.ammoBank,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: mineItem,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageResource, //Account5
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: planet,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: starbase.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleetFoodAcct, //foodTokenFrom
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleetAmmoAcct, //ammoTokenFrom
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: planetResourceToken, //resourceTokenFrom
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleetResourceToken, //resourceTokenTo
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.food,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.ammo,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: foodCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: ammoCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: resourceCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.account.cargo.statsDefinition,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'),
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                    isSigner: false,
                    isWritable: false
                },
            ]).instruction()}

            let tx2 = { instruction: await sageProgram.methods.stopMiningAsteroid({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx)}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                resource: sageResource,
                planet: planet,
                fuelTank : fleet.fuelTank,
                cargoType: fuelCargoTypeAcct.publicKey,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: fleet.fuelToken,
                tokenMint: sageGameAcct.account.mints.fuel,
                cargoProgram: new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH'),
                tokenProgram: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend([tx1,tx2]);
            fleet.busy = false;
            console.log('---STOP MINE---');
            console.log(txResult);
            resolve(txResult);
        });
    }

    async function addAssistInput(fleet) {
        let fleetSavedData = await GM.getValue(fleet.publicKey.toString(), '{}');
        let fleetParsedData = JSON.parse(fleetSavedData);
        let fleetRow = document.createElement('tr');
        fleetRow.classList.add('assist-fleet-row');
        fleetRow.setAttribute('pk', fleet.publicKey.toString());

        let fleetLabel = document.createElement('span');
        fleetLabel.innerHTML = fleet.label;
        let fleetLabelTd = document.createElement('td');
        fleetLabelTd.appendChild(fleetLabel);

        let assistAssignments = ['','Scan','Mine','Transport'];
        let assignmentOptionsStr = '';
        let fleetAssignment = document.createElement('select');
        assistAssignments.forEach( function(assignment) {assignmentOptionsStr += '<option value="' + assignment + '">' + assignment + '</option>';});
        fleetAssignment.innerHTML = assignmentOptionsStr;
        fleetAssignment.value = fleetParsedData && fleetParsedData.assignment ? fleetParsedData.assignment : '';
        let fleetAssignmentTd = document.createElement('td');
        fleetAssignmentTd.appendChild(fleetAssignment);
/*
        let fleetResupply = document.createElement('input');
        fleetResupply.setAttribute('type', 'checkbox');
        if (fleetAssignment.value !== 'Transport') fleetResupply.setAttribute('disabled', '');
        fleetResupply.checked = fleetParsedData && fleetParsedData.resupply && fleetParsedData.resupply == 'true' ? true : false;
        let fleetResupplyTd = document.createElement('td');
        fleetResupplyTd.appendChild(fleetResupply);
        fleetAssignment.onchange = function() {
            fleetAssignment.value == 'Transport' ? fleetResupply.removeAttribute('disabled') : fleetResupply.setAttribute('disabled', '');
        };
*/
/*
        let assistResources = ['','Arco','Biomass','Carbon','Copper Ore','Diamond','Hydrogen','Iron Ore','Lumanite','Rochinol']
        let optionsStr = '';
        let fleetMineRes = document.createElement('select');
        assistResources.forEach( function(resource) {optionsStr += '<option value="' + resource + '">' + resource + '</option>';});
        fleetMineRes.innerHTML = optionsStr;
        let resourceToken = fleetParsedData && fleetParsedData.mineResource && fleetParsedData.mineResource !== '' ? resourceTokens.find(r => r.token == fleetParsedData.mineResource) : '';
        fleetMineRes.value = resourceToken && resourceToken.name ? resourceToken.name : '';
        let fleetMineResTd = document.createElement('td');
        fleetMineResTd.appendChild(fleetMineRes);
*/
        let fleetDestCoord = document.createElement('input');
        fleetDestCoord.setAttribute('type', 'text');
        fleetDestCoord.placeholder = 'x, y';
        fleetDestCoord.style.width = '50px';
        fleetDestCoord.value = fleetParsedData && fleetParsedData.dest ? fleetParsedData.dest : '';
        let fleetDestCoordTd = document.createElement('td');
        fleetDestCoordTd.appendChild(fleetDestCoord);

        let fleetStarbaseCoord = document.createElement('input');
        fleetStarbaseCoord.setAttribute('type', 'text');
        fleetStarbaseCoord.placeholder = 'x, y';
        fleetStarbaseCoord.style.width = '50px';
        fleetStarbaseCoord.value = fleetParsedData && fleetParsedData.starbase ? fleetParsedData.starbase : '';
        let fleetStarbaseCoordTd = document.createElement('td');
        fleetStarbaseCoordTd.appendChild(fleetStarbaseCoord);

        let fleetSubwarpPref = document.createElement('input');
        fleetSubwarpPref.setAttribute('type', 'checkbox');
        fleetSubwarpPref.checked = fleetParsedData && fleetParsedData.subwarpPref && fleetParsedData.subwarpPref == 'true' ? true : false;
        let fleetSubwarpPrefTd = document.createElement('td');
        fleetSubwarpPrefTd.appendChild(fleetSubwarpPref);

        let fleetCargoCapacity = document.createElement('span');
        fleetCargoCapacity.innerHTML = fleet.cargoCapacity;
        let fleetCargoCapacityTd = document.createElement('td');
        fleetCargoCapacityTd.appendChild(fleetCargoCapacity);

        let fleetAmmoCapacity = document.createElement('span');
        fleetAmmoCapacity.innerHTML = fleet.ammoCapacity;
        let fleetAmmoCapacityTd = document.createElement('td');
        fleetAmmoCapacityTd.appendChild(fleetAmmoCapacity);

        let fleetFuelCapacity = document.createElement('span');
        fleetFuelCapacity.innerHTML = fleet.fuelCapacity;
        let fleetFuelCapacityTd = document.createElement('td');
        fleetFuelCapacityTd.appendChild(fleetFuelCapacity);

        fleetRow.appendChild(fleetLabelTd);
        fleetRow.appendChild(fleetAssignmentTd);
        fleetRow.appendChild(fleetDestCoordTd);
        fleetRow.appendChild(fleetStarbaseCoordTd);
        fleetRow.appendChild(fleetSubwarpPrefTd);
        fleetRow.appendChild(fleetCargoCapacityTd);
        fleetRow.appendChild(fleetAmmoCapacityTd);
        fleetRow.appendChild(fleetFuelCapacityTd);
        let targetElem = document.querySelector('#assistModal .assist-modal-body table');
        targetElem.appendChild(fleetRow);

        let scanRow = document.createElement('tr');
        scanRow.classList.add('assist-scan-row');
        scanRow.style.display = fleetParsedData && fleetParsedData.assignment == 'Scan' ? 'table-row' : 'none';
        fleetParsedData && fleetParsedData.assignment == 'Scan' && fleetRow.classList.add('show-top-border');
        targetElem.appendChild(scanRow);

        let scanPadTd = document.createElement('td');
        scanRow.appendChild(scanPadTd);

        let scanMinLabel = document.createElement('span');
        scanMinLabel.innerHTML = 'Minimum Probability:';
        let scanMin = document.createElement('input');
        scanMin.setAttribute('type', 'text');
        scanMin.placeholder = '10';
        scanMin.style.width = '30px';
        scanMin.style.marginRight = '10px';
        scanMin.value = fleetParsedData && fleetParsedData.scanMin ? fleetParsedData.scanMin : '';
        let scanMinDiv = document.createElement('div');
        scanMinDiv.appendChild(scanMinLabel);
        scanMinDiv.appendChild(scanMin);
        let scanMinTd = document.createElement('td');
        scanMinTd.setAttribute('colspan', '3');
        scanMinTd.appendChild(scanMinDiv);
        scanRow.appendChild(scanMinTd);

        let scanMoveLabel = document.createElement('span');
        scanMoveLabel.innerHTML = 'Move While Scanning:';
        let scanMove = document.createElement('input');
        scanMove.setAttribute('type', 'checkbox');
        scanMove.checked = fleetParsedData && fleetParsedData.scanMove && fleetParsedData.scanMove == 'false' ? false : true;
        scanMove.style.marginRight = '10px';
        let scanMoveDiv = document.createElement('div');
        scanMoveDiv.appendChild(scanMoveLabel);
        scanMoveDiv.appendChild(scanMove);
        let scanMoveTd = document.createElement('td');
        scanMoveTd.setAttribute('colspan', '4');
        scanMoveTd.appendChild(scanMoveDiv);
        scanRow.appendChild(scanMoveTd);
/*
        let scanTd = document.createElement('td');
        scanTd.setAttribute('colspan', '8');
        let scanWrapper = document.createElement('div');
        scanWrapper.classList.add('scan-wrapper');
        scanWrapper.style.display = 'flex'
        scanWrapper.style.flexDirection = 'row';
        scanWrapper.style.justifyContent = 'flex-start';
        scanWrapper.appendChild(scanMinDiv);
        scanWrapper.appendChild(scanMoveDiv);
        //scanWrapper.appendChild(transportSBResource2Div);
        //scanWrapper.appendChild(transportSBResource3Div);
        //scanWrapper.appendChild(transportSBResource4Div);
        scanTd.appendChild(scanWrapper);
        scanRow.appendChild(scanTd);
*/
        targetElem.appendChild(scanRow);

        let mineRow = document.createElement('tr');
        mineRow.classList.add('assist-mine-row');
        mineRow.style.display = fleetParsedData && fleetParsedData.assignment == 'Mine' ? 'table-row' : 'none';
        fleetParsedData && fleetParsedData.assignment == 'Mine' && fleetRow.classList.add('show-top-border');
        targetElem.appendChild(mineRow);

        let minePadTd = document.createElement('td');
        mineRow.appendChild(minePadTd);

        let mineResLabel = document.createElement('span');
        mineResLabel.innerHTML = 'Resource to mine:';
        let assistResources = ['','Arco','Biomass','Carbon','Copper Ore','Diamond','Hydrogen','Iron Ore','Lumanite','Rochinol']
        let optionsStr = '';
        let fleetMineRes = document.createElement('select');
        assistResources.forEach( function(resource) {optionsStr += '<option value="' + resource + '">' + resource + '</option>';});
        fleetMineRes.innerHTML = optionsStr;
        let resourceToken = fleetParsedData && fleetParsedData.mineResource && fleetParsedData.mineResource !== '' ? resourceTokens.find(r => r.token == fleetParsedData.mineResource) : '';
        fleetMineRes.value = resourceToken && resourceToken.name ? resourceToken.name : '';
        let fleetMineResTd = document.createElement('td');
        fleetMineResTd.setAttribute('colspan', '7');
        fleetMineResTd.appendChild(mineResLabel);
        fleetMineResTd.appendChild(fleetMineRes);
        mineRow.appendChild(fleetMineResTd);
        targetElem.appendChild(mineRow);

        let transportRow = document.createElement('tr');
        transportRow.classList.add('assist-transport-row');
        transportRow.style.display = fleetParsedData && fleetParsedData.assignment == 'Transport' ? 'table-row' : 'none';
        fleetParsedData && fleetParsedData.assignment == 'Transport' && fleetRow.classList.add('show-top-border');
        targetElem.appendChild(transportRow);

        let transportLabel1 = document.createElement('div');
        transportLabel1.innerHTML = 'To Target:';
        transportLabel1.style.width = '84px';
        transportLabel1.style.minWidth = '84px';

        let transportResources = ['','Ammo','Food','Fuel','SDU','Toolkit','Arco','Biomass','Carbon','Copper Ore','Diamond','Hydrogen','Iron Ore','Lumanite','Rochinol']
        let transportOptStr = '';
        transportResources.forEach( function(resource) {transportOptStr += '<option value="' + resource + '">' + resource + '</option>';});
        let transportResource1 = document.createElement('select');
        transportResource1.innerHTML = transportOptStr;
        let transportResource1Token = fleetParsedData && fleetParsedData.transportResource1 && fleetParsedData.transportResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource1) : '';
        transportResource1.value = transportResource1Token && transportResource1Token.name ? transportResource1Token.name : '';
        let transportResource1Perc = document.createElement('input');
        transportResource1Perc.setAttribute('type', 'text');
        transportResource1Perc.placeholder = '0';
        transportResource1Perc.style.width = '60px';
        transportResource1Perc.style.marginRight = '10px';
        transportResource1Perc.value = fleetParsedData && fleetParsedData.transportResource1Perc ? fleetParsedData.transportResource1Perc : '';
        let transportResource1Div = document.createElement('div');
        transportResource1Div.appendChild(transportResource1);
        transportResource1Div.appendChild(transportResource1Perc);

        let transportResource2 = document.createElement('select');
        transportResource2.innerHTML = transportOptStr;
        let transportResource2Token = fleetParsedData && fleetParsedData.transportResource2 && fleetParsedData.transportResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource2) : '';
        transportResource2.value = transportResource2Token && transportResource2Token.name ? transportResource2Token.name : '';
        let transportResource2Perc = document.createElement('input');
        transportResource2Perc.setAttribute('type', 'text');
        transportResource2Perc.placeholder = '0';
        transportResource2Perc.style.width = '60px';
        transportResource2Perc.style.marginRight = '10px';
        transportResource2Perc.value = fleetParsedData && fleetParsedData.transportResource2Perc ? fleetParsedData.transportResource2Perc : '';
        let transportResource2Div = document.createElement('div');
        transportResource2Div.appendChild(transportResource2);
        transportResource2Div.appendChild(transportResource2Perc);

        let transportResource3 = document.createElement('select');
        transportResource3.innerHTML = transportOptStr;
        let transportResource3Token = fleetParsedData && fleetParsedData.transportResource3 && fleetParsedData.transportResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource3) : '';
        transportResource3.value = transportResource3Token && transportResource3Token.name ? transportResource3Token.name : '';
        let transportResource3Perc = document.createElement('input');
        transportResource3Perc.setAttribute('type', 'text');
        transportResource3Perc.placeholder = '0';
        transportResource3Perc.style.width = '60px';
        transportResource3Perc.style.marginRight = '10px';
        transportResource3Perc.value = fleetParsedData && fleetParsedData.transportResource3Perc ? fleetParsedData.transportResource3Perc : '';
        let transportResource3Div = document.createElement('div');
        transportResource3Div.appendChild(transportResource3);
        transportResource3Div.appendChild(transportResource3Perc);

        let transportResource4 = document.createElement('select');
        transportResource4.innerHTML = transportOptStr;
        let transportResource4Token = fleetParsedData && fleetParsedData.transportResource4 && fleetParsedData.transportResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource4) : '';
        transportResource4.value = transportResource4Token && transportResource4Token.name ? transportResource4Token.name : '';
        let transportResource4Perc = document.createElement('input');
        transportResource4Perc.setAttribute('type', 'text');
        transportResource4Perc.placeholder = '0';
        transportResource4Perc.style.width = '60px';
        transportResource4Perc.value = fleetParsedData && fleetParsedData.transportResource4Perc ? fleetParsedData.transportResource4Perc : '';
        let transportResource4Div = document.createElement('div');
        transportResource4Div.appendChild(transportResource4);
        transportResource4Div.appendChild(transportResource4Perc);

        let transportLabel2 = document.createElement('div');
        transportLabel2.innerHTML = 'To Starbase:';
        transportLabel2.style.width = '84px';
        transportLabel2.style.minWidth = '84px';

        let transportSBResource1 = document.createElement('select');
        transportSBResource1.innerHTML = transportOptStr;
        let transportSBResource1Token = fleetParsedData && fleetParsedData.transportSBResource1 && fleetParsedData.transportSBResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource1) : '';
        transportSBResource1.value = transportSBResource1Token && transportSBResource1Token.name ? transportSBResource1Token.name : '';
        let transportSBResource1Perc = document.createElement('input');
        transportSBResource1Perc.setAttribute('type', 'text');
        transportSBResource1Perc.placeholder = '0';
        transportSBResource1Perc.style.width = '60px';
        transportSBResource1Perc.style.marginRight = '10px';
        transportSBResource1Perc.value = fleetParsedData && fleetParsedData.transportSBResource1Perc ? fleetParsedData.transportSBResource1Perc : '';
        let transportSBResource1Div = document.createElement('div');
        transportSBResource1Div.appendChild(transportSBResource1);
        transportSBResource1Div.appendChild(transportSBResource1Perc);

        let transportSBResource2 = document.createElement('select');
        transportSBResource2.innerHTML = transportOptStr;
        let transportSBResource2Token = fleetParsedData && fleetParsedData.transportSBResource2 && fleetParsedData.transportSBResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource2) : '';
        transportSBResource2.value = transportSBResource2Token && transportSBResource2Token.name ? transportSBResource2Token.name : '';
        let transportSBResource2Perc = document.createElement('input');
        transportSBResource2Perc.setAttribute('type', 'text');
        transportSBResource2Perc.placeholder = '0';
        transportSBResource2Perc.style.width = '60px';
        transportSBResource2Perc.style.marginRight = '10px';
        transportSBResource2Perc.value = fleetParsedData && fleetParsedData.transportSBResource2Perc ? fleetParsedData.transportSBResource2Perc : '';
        let transportSBResource2Div = document.createElement('div');
        transportSBResource2Div.appendChild(transportSBResource2);
        transportSBResource2Div.appendChild(transportSBResource2Perc);

        let transportSBResource3 = document.createElement('select');
        transportSBResource3.innerHTML = transportOptStr;
        let transportSBResource3Token = fleetParsedData && fleetParsedData.transportSBResource3 && fleetParsedData.transportSBResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource3) : '';
        transportSBResource3.value = transportSBResource3Token && transportSBResource3Token.name ? transportSBResource3Token.name : '';
        let transportSBResource3Perc = document.createElement('input');
        transportSBResource3Perc.setAttribute('type', 'text');
        transportSBResource3Perc.placeholder = '0';
        transportSBResource3Perc.style.width = '60px';
        transportSBResource3Perc.style.marginRight = '10px';
        transportSBResource3Perc.value = fleetParsedData && fleetParsedData.transportSBResource3Perc ? fleetParsedData.transportSBResource3Perc : '';
        let transportSBResource3Div = document.createElement('div');
        transportSBResource3Div.appendChild(transportSBResource3);
        transportSBResource3Div.appendChild(transportSBResource3Perc);

        let transportSBResource4 = document.createElement('select');
        transportSBResource4.innerHTML = transportOptStr;
        let transportSBResource4Token = fleetParsedData && fleetParsedData.transportSBResource4 && fleetParsedData.transportSBResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource4) : '';
        transportSBResource4.value = transportSBResource4Token && transportSBResource4Token.name ? transportSBResource4Token.name : '';
        let transportSBResource4Perc = document.createElement('input');
        transportSBResource4Perc.setAttribute('type', 'text');
        transportSBResource4Perc.placeholder = '0';
        transportSBResource4Perc.style.width = '60px';
        transportSBResource4Perc.style.marginRight = '10px';
        transportSBResource4Perc.value = fleetParsedData && fleetParsedData.transportSBResource4Perc ? fleetParsedData.transportSBResource4Perc : '';
        let transportSBResource4Div = document.createElement('div');
        transportSBResource4Div.appendChild(transportSBResource4);
        transportSBResource4Div.appendChild(transportSBResource4Perc);

        let transportTd = document.createElement('td');
        transportTd.setAttribute('colspan', '8');
        let transportTargettWrapper = document.createElement('div');
        transportTargettWrapper.classList.add('transport-to-target');
        transportTargettWrapper.style.display = 'flex'
        transportTargettWrapper.style.flexDirection = 'row';
        transportTargettWrapper.style.justifyContent = 'flex-start';
        transportTargettWrapper.appendChild(transportLabel1);
        transportTargettWrapper.appendChild(transportResource1Div);
        transportTargettWrapper.appendChild(transportResource2Div);
        transportTargettWrapper.appendChild(transportResource3Div);
        transportTargettWrapper.appendChild(transportResource4Div);
        let transportStarbaseWrapper = document.createElement('div');
        transportStarbaseWrapper.classList.add('transport-to-starbase');
        transportStarbaseWrapper.style.display = 'flex'
        transportStarbaseWrapper.style.flexDirection = 'row';
        transportStarbaseWrapper.style.justifyContent = 'flex-start';
        transportStarbaseWrapper.appendChild(transportLabel2);
        transportStarbaseWrapper.appendChild(transportSBResource1Div);
        transportStarbaseWrapper.appendChild(transportSBResource2Div);
        transportStarbaseWrapper.appendChild(transportSBResource3Div);
        transportStarbaseWrapper.appendChild(transportSBResource4Div);
        transportTd.appendChild(transportTargettWrapper);
        transportTd.appendChild(transportStarbaseWrapper);
        transportRow.appendChild(transportTd);
        targetElem.appendChild(transportRow);

        let padRow = document.createElement('tr');
        padRow.classList.add('assist-pad-row');
        padRow.style.display = fleetParsedData && fleetParsedData.assignment ? 'table-row' : 'none';
        let padRowTd = document.createElement('td');
        padRowTd.setAttribute('colspan', '7');
        padRowTd.style.height = '15px';
        padRow.appendChild(padRowTd);
        targetElem.appendChild(padRow);

        fleetAssignment.onchange = function() {
            if (fleetAssignment.value == 'Scan') {
                scanRow.style.display = 'table-row';
                mineRow.style.display = 'none';
                transportRow.style.display = 'none';
                padRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else if (fleetAssignment.value == 'Mine') {
                mineRow.style.display = 'table-row';
                scanRow.style.display = 'none';
                transportRow.style.display = 'none';
                padRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else if (fleetAssignment.value == 'Transport') {
                transportRow.style.display = 'table-row';
                scanRow.style.display = 'none';
                mineRow.style.display = 'none';
                padRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else {
                scanRow.style.display = 'none';
                mineRow.style.display = 'none';
                transportRow.style.display = 'none';
                padRow.style.display = 'none';
                fleetRow.classList.remove('show-top-border');
            }
        };
        /*
        fleetAssignment.onchange = function(event) {
            console.log(event.currentTarget);
            if (event.currentTarget.checked) {
                transportRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else {
                transportRow.style.display = 'none';
                fleetRow.classList.remove('show-top-border');
            }
        };
        */
    }

    function updateAssistStatus(fleet) {
        let targetRow = document.querySelectorAll('#assistStatus .assist-fleet-row[pk="' + fleet.publicKey.toString() + '"]');

        if (targetRow.length > 0) {
            targetRow[0].children[1].firstChild.innerHTML = fleet.toolCnt;
            targetRow[0].children[2].firstChild.innerHTML = fleet.sduCnt;
            targetRow[0].children[3].firstChild.innerHTML = fleet.state;
        } else {
            let fleetRow = document.createElement('tr');
            fleetRow.classList.add('assist-fleet-row');
            fleetRow.setAttribute('pk', fleet.publicKey.toString());
            let fleetLabel = document.createElement('span');
            fleetLabel.innerHTML = fleet.label;
            let fleetLabelTd = document.createElement('td');
            fleetLabelTd.appendChild(fleetLabel);
            let fleetTool = document.createElement('span');
            fleetTool.innerHTML = fleet.toolCnt;
            let fleetToolTd = document.createElement('td');
            fleetToolTd.appendChild(fleetTool);
            let fleetSdu = document.createElement('span');
            fleetSdu.innerHTML = fleet.sduCnt;
            let fleetSduTd = document.createElement('td');
            fleetSduTd.appendChild(fleetSdu);
            let fleetStatus = document.createElement('span');
            fleetStatus.innerHTML = fleet.state;
            let fleetStatusTd = document.createElement('td');
            fleetStatusTd.appendChild(fleetStatus);
            fleetRow.appendChild(fleetLabelTd);
            fleetRow.appendChild(fleetToolTd);
            fleetRow.appendChild(fleetSduTd);
            fleetRow.appendChild(fleetStatusTd);
            let targetElem = document.querySelector('#assistStatus .assist-modal-body table');
            targetElem.appendChild(fleetRow);
        }
    }

    async function saveAssistInput() {
        let fleetRows = document.querySelectorAll('#assistModal .assist-fleet-row');
        let scanRows = document.querySelectorAll('#assistModal .assist-scan-row');
        let mineRows = document.querySelectorAll('#assistModal .assist-mine-row');
        let transportRows = document.querySelectorAll('#assistModal .assist-transport-row > td');
        let errElem = document.querySelectorAll('#assist-modal-error');
        let errBool = false;
        for (let [i, row] of fleetRows.entries()) {
            let rowErrBool = false;
            let fleetPK = row.getAttribute('pk');
            let fleetName = row.children[0].firstChild.innerText;
            let fleetAssignment = row.children[1].firstChild.value;
            //let fleetResupply = row.children[2].firstChild.checked;
            let fleetDestCoord = row.children[2].firstChild.value;
            let fleetStarbaseCoord = row.children[3].firstChild.value;
            let subwarpPref = row.children[4].firstChild.checked;
            let destX = fleetDestCoord.split(',').length > 1 ? fleetDestCoord.split(',')[0].trim() : '';
            let destY = fleetDestCoord.split(',').length > 1 ? fleetDestCoord.split(',')[1].trim() : '';
            let starbaseX = fleetStarbaseCoord.split(',').length > 1 ? fleetStarbaseCoord.split(',')[0].trim() : '';
            let starbaseY = fleetStarbaseCoord.split(',').length > 1 ? fleetStarbaseCoord.split(',')[1].trim() : '';
            let userFleetIndex = userFleets.findIndex(item => {return item.publicKey == fleetPK});
            let moveType = subwarpPref == true ? 'subwarp' : 'warp';
            let moveDist = calculateMovementDistance([starbaseX,starbaseY], [destX,destY]);
            //let maxWarpDist = userFleets[i].maxWarpDistance / 100;
            //let warpCnt = Math.ceil(moveDist / maxWarpDist);
            let warpCost = calculateWarpFuelBurn(userFleets[userFleetIndex], moveDist);
            //if (fleetAssignment !== '' && (moveDist > userFleets[userFleetIndex].maxWarpDistance / 100)) {
            if (fleetAssignment !== '' && (warpCost > userFleets[userFleetIndex].fuelCapacity)) {
                let subwarpCost = calculateSubwarpFuelBurn(userFleets[userFleetIndex], moveDist);
                if (subwarpCost * 2 > userFleets[userFleetIndex].fuelCapacity) {
                    console.log('ERROR: Fleet will not have enough fuel to return to starbase');
                    row.children[4].firstChild.style.border = '2px solid red';
                    row.children[5].firstChild.style.border = '2px solid red';
                    errElem[0].innerHTML = 'ERROR: Distance exceeds fuel capacity';
                    errBool = true;
                    rowErrBool = true;
                } else {
                    moveType = 'subwarp';
                }
            }

            let scanMin = parseInt(scanRows[i].children[1].children[0].children[1].value) || 0;
            let scanMove = scanRows[i].children[2].children[0].children[1].checked;

            let fleetMineResource = mineRows[i].children[1].children[1].value;
            fleetMineResource = fleetMineResource !== '' ? resourceTokens.find(r => r.name == fleetMineResource).token : '';

            let transportToTarget = transportRows[i].querySelectorAll(':scope > .transport-to-target > div');
            let transportResource1 = transportToTarget[1].children[0].value;
            transportResource1 = transportResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource1).token : '';
            let transportResource1Perc = parseInt(transportToTarget[1].children[1].value) || 0;
            let transportResource2 = transportToTarget[2].children[0].value;
            transportResource2 = transportResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource2).token : '';
            let transportResource2Perc = parseInt(transportToTarget[2].children[1].value) || 0;
            let transportResource3 = transportToTarget[3].children[0].value;
            transportResource3 = transportResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource3).token : '';
            let transportResource3Perc = parseInt(transportToTarget[3].children[1].value) || 0;
            let transportResource4 = transportToTarget[4].children[0].value;
            transportResource4 = transportResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource4).token : '';
            let transportResource4Perc = parseInt(transportToTarget[4].children[1].value) || 0;
            let ammoWanted = 0;
            let fuelWanted = 0;
            let cargoWanted = 0;
            for (let i=1; i < 5; i++) {
                if (transportToTarget[i].children[0].value == 'Ammo') {
                    ammoWanted += parseInt(transportToTarget[i].children[1].value);
                } else if (transportToTarget[i].children[0].value == 'Fuel') {
                    fuelWanted += parseInt(transportToTarget[i].children[1].value);
                } else {
                    cargoWanted += parseInt(transportToTarget[i].children[1].value);
                }
            }
            if (ammoWanted > userFleets[userFleetIndex].ammoCapacity) cargoWanted += ammoWanted - userFleets[userFleetIndex].ammoCapacity;
            if (fuelWanted > userFleets[userFleetIndex].fuelCapacity) cargoWanted += fuelWanted - userFleets[userFleetIndex].fuelCapacity;
            if (cargoWanted > userFleets[userFleetIndex].cargoCapacity) {
                console.log('ERROR');
                transportToTarget[1].children[1].style.border = '2px solid red';
                transportToTarget[2].children[1].style.border = '2px solid red';
                transportToTarget[3].children[1].style.border = '2px solid red';
                transportToTarget[4].children[1].style.border = '2px solid red';
                errElem[0].innerHTML = 'ERROR: Total cannot exceed Max Capacity';
                errBool = true;
                rowErrBool = true;
            }

            let transportToStarbase = transportRows[i].querySelectorAll(':scope > .transport-to-starbase > div');
            let transportSBResource1 = transportToStarbase[1].children[0].value;
            transportSBResource1 = transportSBResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource1).token : '';
            let transportSBResource1Perc = parseInt(transportToStarbase[1].children[1].value) || 0;
            let transportSBResource2 = transportToStarbase[2].children[0].value;
            transportSBResource2 = transportSBResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource2).token : '';
            let transportSBResource2Perc = parseInt(transportToStarbase[2].children[1].value) || 0;
            let transportSBResource3 = transportToStarbase[3].children[0].value;
            transportSBResource3 = transportSBResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource3).token : '';
            let transportSBResource3Perc = parseInt(transportToStarbase[3].children[1].value) || 0;
            let transportSBResource4 = transportToStarbase[4].children[0].value;
            transportSBResource4 = transportSBResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource4).token : '';
            let transportSBResource4Perc = parseInt(transportToStarbase[4].children[1].value) || 0;
            let ammoSBWanted = 0;
            let fuelSBWanted = 0;
            let cargoSBWanted = 0;
            for (let i=1; i < 5; i++) {
                if (transportToStarbase[i].children[0].value == 'Ammo') {
                    ammoSBWanted += parseInt(transportToStarbase[i].children[1].value);
                } else if (transportToStarbase[i].children[0].value == 'Fuel') {
                    fuelSBWanted += parseInt(transportToStarbase[i].children[1].value);
                } else {
                    cargoSBWanted += parseInt(transportToStarbase[i].children[1].value);
                }
            }
            if (ammoSBWanted > userFleets[userFleetIndex].ammoCapacity) cargoSBWanted += ammoSBWanted - userFleets[userFleetIndex].ammoCapacity;
            if (fuelSBWanted > userFleets[userFleetIndex].fuelCapacity) cargoSBWanted += fuelSBWanted - userFleets[userFleetIndex].fuelCapacity;
            if (cargoSBWanted > userFleets[userFleetIndex].cargoCapacity) {
                console.log('ERROR');
                transportToStarbase[1].children[1].style.border = '2px solid red';
                transportToStarbase[2].children[1].style.border = '2px solid red';
                transportToStarbase[3].children[1].style.border = '2px solid red';
                transportToStarbase[4].children[1].style.border = '2px solid red';
                errElem[0].innerHTML = 'ERROR: Total cannot exceed Max Capacity';
                errBool = true;
                rowErrBool = true;
            }
            if (rowErrBool === false) {
                let fleetSavedData = await GM.getValue(fleetPK, '{}');
                let fleetParsedData = JSON.parse(fleetSavedData);
                let fleetMoveTarget = fleetParsedData && fleetParsedData.moveTarget ? fleetParsedData.moveTarget : '';
                destX = Number(destX);
                destY = Number(destY);
                let scanShiftX = destX > 0 ? -1 : 1;
                let scanShiftY = destY > 0 ? -1 : 1;
                let scanBlock = [];
                if (destX !== '' && destY !== '') {
                    scanBlock.push([destX, destY]);
                    scanBlock.push([destX+scanShiftX, destY]);
                    scanBlock.push([destX+scanShiftX, destY+scanShiftY]);
                    scanBlock.push([destX, destY+scanShiftY]);
                }
                await GM.setValue(fleetPK, `{\"name\": \"${fleetName}\", \"assignment\": \"${fleetAssignment}\", \"mineResource\": \"${fleetMineResource}\", \"dest\": \"${fleetDestCoord}\", \"starbase\": \"${fleetStarbaseCoord}\", \"moveType\": \"${moveType}\", \"subwarpPref\": \"${subwarpPref}\", \"moveTarget\": \"${fleetMoveTarget}\", \"transportResource1\": \"${transportResource1}\", \"transportResource1Perc\": ${transportResource1Perc}, \"transportResource2\": \"${transportResource2}\", \"transportResource2Perc\": ${transportResource2Perc}, \"transportResource3\": \"${transportResource3}\", \"transportResource3Perc\": ${transportResource3Perc}, \"transportResource4\": \"${transportResource4}\", \"transportResource4Perc\": ${transportResource4Perc}, \"transportSBResource1\": \"${transportSBResource1}\", \"transportSBResource1Perc\": ${transportSBResource1Perc}, \"transportSBResource2\": \"${transportSBResource2}\", \"transportSBResource2Perc\": ${transportSBResource2Perc}, \"transportSBResource3\": \"${transportSBResource3}\", \"transportSBResource3Perc\": ${transportSBResource3Perc}, \"transportSBResource4\": \"${transportSBResource4}\", \"transportSBResource4Perc\": ${transportSBResource4Perc}, \"scanBlock\": ${JSON.stringify(scanBlock)}, \"scanMin\": ${scanMin}, \"scanMove\": \"${scanMove}\"}`);
                userFleets[userFleetIndex].mineResource = fleetMineResource;
                userFleets[userFleetIndex].destCoord = fleetDestCoord;
                userFleets[userFleetIndex].starbaseCoord = fleetStarbaseCoord;
                userFleets[userFleetIndex].moveType = moveType;
                userFleets[userFleetIndex].scanBlock = scanBlock;
                userFleets[userFleetIndex].scanMin = scanMin;
                userFleets[userFleetIndex].scanMove = scanMove ? 'true' : 'false';
            }
        }
        if (errBool === false) {
            errElem[0].innerHTML = '';
            assistModalToggle();
        }
    }

    async function assistImportToggle() {
        let targetElem = document.querySelector('#importModal');
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
            let importText = document.querySelector('#importText');
            importText.value = '{';
            let fleetKeys = GM_listValues();
            console.log(fleetKeys);
            for (let i in fleetKeys) {
                let fleetSavedData = await GM.getValue(fleetKeys[i], '{}');
                //let fleetParsedData = JSON.parse(fleetSavedData);
                importText.value += '"' + fleetKeys[i] + '":' + fleetSavedData;
                if (i < fleetKeys.length - 1) importText.value += ',';
            }
            importText.value += '}';
            assistModalToggle();
        } else {
            targetElem.style.display = 'none';
        }
    }

    async function saveConfigImport() {
        let importText = document.querySelector('#importText');
        let jsonConfig = JSON.parse(importText.value);
        for (let key in jsonConfig) {
            let fleetObj = jsonConfig[key];
            let fleetJson = JSON.stringify(fleetObj);
            await GM.setValue(key, fleetJson);
        }
        assistImportToggle();
    }

    async function saveTargetsImport() {
        let importText = document.querySelector('#importText');
        let jsonTargets = JSON.parse(importText.value);
        for (let key in jsonTargets) {
            let destXStr = jsonTargets[key].sector_target[0].toString().trim();
            let destYStr = jsonTargets[key].sector_target[1].toString().trim();
            let destX = Number(destXStr);
            let destY = Number(destYStr);
            let scanShiftX = destX > 0 ? -1 : 1;
            let scanShiftY = destY > 0 ? -1 : 1;
            let scanBlock = [];
            if (destX !== '' && destY !== '') {
                scanBlock.push([destX, destY]);
                scanBlock.push([destX+scanShiftX, destY]);
                scanBlock.push([destX+scanShiftX, destY+scanShiftY]);
                scanBlock.push([destX, destY+scanShiftY]);
            }
            let fleetSavedData = await GM.getValue(key, '{}');
            let fleetParsedData = JSON.parse(fleetSavedData);
            fleetParsedData.dest = destXStr + ',' + destYStr;
            fleetParsedData.scanBlock = scanBlock;
            await GM.setValue(key, JSON.stringify(fleetParsedData));
            let userFleetIndex = userFleets.findIndex(item => {return item.publicKey == key});
            userFleets[userFleetIndex].destCoord = destXStr + ',' + destYStr;
            userFleets[userFleetIndex].scanBlock = scanBlock;
        }
        assistImportToggle();
    }

    function assistModalToggle() {
        let targetElem = document.querySelector('#assistModal');
        if (targetElem.style.display === 'none') {
            document.querySelectorAll('#assistModal .assist-fleet-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-scan-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-mine-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-pad-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-transport-row').forEach(e => e.remove());
            for (let fleet of userFleets) {
                addAssistInput(fleet);
            }
            targetElem.style.display = 'block';
        } else {
            targetElem.style.display = 'none';
        }
    }

    function assistStatusToggle() {
        let targetElem = document.querySelector('#assistStatus');
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
        } else {
            targetElem.style.display = 'none';
        }
    }

    function assistCheckToggle() {
        let targetElem = document.querySelector('#assistCheck');
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
        } else {
            targetElem.style.display = 'none';
        }
    }

    async function assistProfileToggle(profiles) {
        return new Promise(async resolve => {
            let targetElem = document.querySelector('#profileModal');
            if (targetElem.style.display === 'none' && profiles) {
                targetElem.style.display = 'block';
                let contentElem = document.querySelector('#profileDiv');
                let transportOptStr = '';
                profiles.forEach( function(profile) {transportOptStr += '<option value="' + profile.profile + '">' + profile.name + '  [' + profile.profile + ']</option>';});
                let profileSelect = document.createElement('select');
                profileSelect.size = profiles.length + 1;
                profileSelect.style.padding = '2px 10px';
                profileSelect.innerHTML = transportOptStr;
                contentElem.append(profileSelect);
                profileSelect.onchange = function() {
                    console.log(profileSelect.value);
                    let selected = profiles.find(o => o.profile === profileSelect.value);
                    assistProfileToggle(null);
                    resolve(selected);
                }
            } else {
                targetElem.style.display = 'none';
                resolve(null);
            }
        });
    }
/*
    async function assistAddAcctToggle() {
            let targetElem = document.querySelector('#addAcctModal');
            if (targetElem.style.display === 'none') {
                targetElem.style.display = 'block';
            } else {
                targetElem.style.display = 'none';
            }
    }
*/
    async function handleUndockAll(i, fleetCoords, destCoords) {
        for (let i=0, n=userFleets.length; i < n; i++) {
            let fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
            let [fleetState, extra] = getFleetState(fleetAcctInfo);
            if (fleetState === 'StarbaseLoadingBay') {
                let starbase = await sageProgram.account.starbase.fetch(extra.starbase);
                let coords = starbase.sector[0].toNumber() + ',' + starbase.sector[1].toNumber();
                await execUndock(userFleets[i], coords);
                console.log(`[${userFleets[i].label}] Idle`);
                userFleets[i].state = 'Idle';
            }
        }
    }

    async function handleMovement(i, moveDist, moveX, moveY) {
        return new Promise(async resolve => {
            let moveTime = 1;
            //let moveCost = 0;
            let warpCooldownFinished = 0;
            let fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
            let [fleetState, extra] = getFleetState(fleetAcctInfo);
            if (fleetState == 'Idle' && extra.length > 1 && moveDist && moveX !== null && moveX !== '' && moveY != null && moveY !== '') {
                if (extra[0] !== moveX || extra[1] !== moveY) {
                    let warpCost = calculateWarpFuelBurn(userFleets[i], moveDist);
                    let subwarpCost = calculateSubwarpFuelBurn(userFleets[i], moveDist);
                    let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;

                    let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let currentCargoFuel = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentCargoFuelCnt = currentCargoFuel ? currentCargoFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    if (userFleets[i].moveType == 'warp' && (currentFuelCnt + currentCargoFuelCnt) >= warpCost) {
                        let fleetAcctData = sageProgram.coder.accounts.decode('Fleet', fleetAcctInfo.data);
                        let warpCooldownExpiresAt = fleetAcctData.warpCooldownExpiresAt.toNumber() * 1000;
                        while (Date.now() < warpCooldownExpiresAt) {
                            if (userFleets[i].state.slice(0, 13) !== 'Warp Cooldown') {
                                console.log(`[${userFleets[i].label}] Waiting for warp cooldown`);
                                userFleets[i].state = 'Warp Cooldown [' + new Date(warpCooldownExpiresAt).toLocaleTimeString() + ']';
                                updateAssistStatus(userFleets[i]);
                            }
                            await wait(5000);
                        }
                        await wait(2000);
                        if (moveDist > userFleets[i].maxWarpDistance / 100) {
                            let warpCnt = userFleets[i].maxWarpDistance > 0 ? moveDist / (userFleets[i].maxWarpDistance / 100) : 1;
                            let distXRaw = (moveX - extra[0]) / warpCnt;
                            let distYRaw = (moveY - extra[1]) / warpCnt;
                            let distX = distXRaw > 0 ? Math.floor(distXRaw) : Math.ceil(distXRaw);
                            let distY = distYRaw > 0 ? Math.floor(distYRaw) : Math.ceil(distYRaw);
                            moveX = extra[0] + distX;
                            moveY = extra[1] + distY;
                            let fleetSavedData = await GM.getValue(userFleets[i].publicKey.toString(), '{}');
                            let fleetParsedData = JSON.parse(fleetSavedData);
                            let fleetPK = userFleets[i].publicKey.toString();
                            fleetParsedData.moveTarget = userFleets[i].moveTarget;
                            await GM.setValue(fleetPK, JSON.stringify(fleetParsedData));
                            moveDist = calculateMovementDistance(extra, [moveX,moveY]);
                        }
                        console.log(`[${userFleets[i].label}] Warping to [${moveX},${moveY}]`);
                        moveTime = calculateWarpTime(userFleets[i], moveDist);
                        //moveCost = calculateWarpFuelBurn(userFleets[i], moveDist);
                        userFleets[i].state = 'Warp [' + new Date(Date.now()+(moveTime * 1000 + 10000)).toLocaleTimeString() + ']';
                        let warpResult = await execWarp(userFleets[i], moveX, moveY);
                        console.log('Warp Result: ', warpResult);
                        warpCooldownFinished = Date.now() + userFleets[i].warpCooldown*1000 + 2000;
                    } else if (currentFuelCnt + currentCargoFuelCnt >= subwarpCost) {
                        console.log(`[${userFleets[i].label}] Subwarping to [${moveX},${moveY}]`);
                        moveTime = calculateSubwarpTime(userFleets[i], moveDist);
                        //moveCost = calculateSubwarpFuelBurn(userFleets[i], moveDist);
                        userFleets[i].state = 'Subwarp [' + new Date(Date.now()+(moveTime * 1000 + 10000)).toLocaleTimeString() + ']';
                        let subwarpResult = await execSubwarp(userFleets[i], moveX, moveY);
                        console.log('Subwarp Result: ', subwarpResult);
                    } else {
                        console.log(`[${userFleets[i].label}] Unable to move, lack of fuel`);
                        userFleets[i].state = 'ERROR: Not enough fuel';
                    }
                    updateAssistStatus(userFleets[i]);
                }
            }
            await wait(moveTime * 1000);
            fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
            [fleetState, extra] = getFleetState(fleetAcctInfo);
            let warpFinish = fleetState == 'MoveWarp' ? extra.warpFinish.toNumber() * 1000 : 0;
            let subwarpFinish = fleetState == 'MoveSubwarp' ? extra.arrivalTime.toNumber() * 1000 : 0;
            let endTime = warpFinish > subwarpFinish ? warpFinish : subwarpFinish;
            while (endTime > Date.now()) {
                userFleets[i].state = 'Move [' + new Date(endTime).toLocaleTimeString() + ']';
                await wait(10000);
            }
            await wait(2000);
            if (fleetState == 'MoveWarp') {
                console.log(`[${userFleets[i].label}] Exiting Warp`);
                await execExitWarp(userFleets[i]);
                console.log(`[${userFleets[i].label}] Idle`);
                userFleets[i].state = 'Idle';
            } else if (fleetState == 'MoveSubwarp'){
                console.log(`[${userFleets[i].label}] Exiting Subwarp`);
                await execExitSubwarp(userFleets[i]);
                console.log(`[${userFleets[i].label}] Idle`);
                userFleets[i].state = 'Idle';
            }
            updateAssistStatus(userFleets[i]);
            fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
            [fleetState, extra] = getFleetState(fleetAcctInfo);
            if (fleetState == 'Idle' && extra) {
                let targetX = userFleets[i].moveTarget != '' && userFleets[i].moveTarget.split(',').length > 1 ? userFleets[i].moveTarget.split(',')[0].trim() : '';
                let targetY = userFleets[i].moveTarget != '' && userFleets[i].moveTarget.split(',').length > 1 ? userFleets[i].moveTarget.split(',')[1].trim() : '';
                if (extra[0] == targetX && extra[1] == targetY) {
                    userFleets[i].moveTarget = '';
                    let fleetSavedData = await GM.getValue(userFleets[i].publicKey.toString(), '{}');
                    let fleetParsedData = JSON.parse(fleetSavedData);
                    let fleetPK = userFleets[i].publicKey.toString();
                    fleetParsedData.moveTarget = userFleets[i].moveTarget;
                    await GM.setValue(fleetPK, JSON.stringify(fleetParsedData));
                }
            }
            await wait(2000);
            resolve(warpCooldownFinished);
        });
    }

    async function handleScan(i, fleetCoords, destCoords) {
        let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
        let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
        let currentToolAcct = fleetCurrentCargo.value.find(item => item.pubkey.toString() === userFleets[i].repairKitToken.toString());
        let currentToolCnt = currentToolAcct.account.data.parsed.info.delegatedAmount ? currentToolAcct.account.data.parsed.info.delegatedAmount.uiAmount : 0;
        let readyToScan = true;

        if (userFleets[i].scanCost == 0) {
            if (userFleets[i].cargoCapacity - cargoCnt < 100) {
                readyToScan = false;
            }
        } else {
            if (currentToolCnt < userFleets[i].scanCost) {
                readyToScan = false;
            }
        }

        if (readyToScan) {
            let [fleetSduToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    userFleets[i].cargoHold.toBuffer(),
                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM').toBuffer()
                ],
                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            await solanaConnection.getAccountInfo(fleetSduToken) || await createProgramDerivedAccount(fleetSduToken, userFleets[i].cargoHold, new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'));

            if ((fleetCoords[0] !== destCoords[0] || fleetCoords[1] !== destCoords[1])) {
                if (userFleets[i].state.slice(0, 13) !== 'Warp Cooldown') {
                    let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let starbaseX = userFleets[i].starbaseCoord.split(',')[0].trim();
                    let starbaseY = userFleets[i].starbaseCoord.split(',')[1].trim();
                    let furthestPoint = userFleets[i].scanBlock.reduce((max, val) => calculateMovementDistance(max, [starbaseX,starbaseY]) > calculateMovementDistance(val, [starbaseX,starbaseY]) ? max : val);
                    let distToStarbase = Math.max(calculateMovementDistance(fleetCoords, [starbaseX,starbaseY]), calculateMovementDistance(furthestPoint, [starbaseX,starbaseY]));
                    console.log(`[${userFleets[i].label}] DEBUG`);
                    console.log(`[${userFleets[i].label}] distToStarbase: ${distToStarbase}`);
                    let fuelNeeded = 0;
                    let exactFuelNeeded = 0;
                    if (userFleets[i].moveType == 'warp') {
                        fuelNeeded = calculateWarpFuelBurn(userFleets[i], distToStarbase) + calculateWarpFuelBurn(userFleets[i], 2);
                        exactFuelNeeded = calculateWarpFuelBurn(userFleets[i], distToStarbase);
                    } else {
                        fuelNeeded = calculateSubwarpFuelBurn(userFleets[i], distToStarbase) + calculateSubwarpFuelBurn(userFleets[i], 2);
                        exactFuelNeeded = calculateSubwarpFuelBurn(userFleets[i], distToStarbase);
                    }
                    console.log(`[${userFleets[i].label}] currentFuelCnt: ${currentFuelCnt}`);
                    console.log(`[${userFleets[i].label}] fuelNeeded: ${exactFuelNeeded}`);
                    if (currentFuelCnt > fuelNeeded) {
                        let moveDist = calculateMovementDistance(fleetCoords, destCoords);
                        if (moveDist > 0) {
                            let warpCooldownFinished = await handleMovement(i, moveDist, destCoords[0], destCoords[1]);
                            console.log(`[${userFleets[i].label}] Movement finished`);
                            userFleets[i].scanSectorStart = Date.now()
                        } else {
                            console.log(`[${userFleets[i].label}] Skipping movement`);
                        }
                    }
                }
            }
            if (Date.now() > userFleets[i].scanEnd) {
                userFleets[i].state = 'Scanning';
                updateAssistStatus(userFleets[i]);
                userFleets[i].scanEnd = Date.now() + (userFleets[i].scanCooldown * 1000 + 600000); // failsafe to avoid duplicate scans in case Solana is lagging
                let scanResult = await execScan(userFleets[i]);
                console.log('Scan Result: ', scanResult);
                userFleets[i].scanSectorStart = userFleets[i].scanSectorStart == 0 ? Date.now() : userFleets[i].scanSectorStart;
                let changesSDU = scanResult ? getBalanceChange(scanResult, userFleets[i].sduToken.toString()) : {postBalance: userFleets[i].sduCnt, preBalance: userFleets[i].sduCnt};
                let changesTool = scanResult ? getBalanceChange(scanResult, userFleets[i].repairKitToken.toString()) : {postBalance: userFleets[i].toolCnt - userFleets[i].scanCost, preBalance: userFleets[i].toolCnt};
                let scanConditionLog = scanResult && scanResult.meta.logMessages ? scanResult.meta.logMessages.find(item => item.startsWith("Program log: SDU probability:")) : null;
                let scanCondition = scanConditionLog ? (Number(scanConditionLog.split(' ').pop())*100).toFixed(4) : 0;
                console.log(`[${userFleets[i].label}] ${new Date(Date.now()).toISOString()}`);
                console.log(`[${userFleets[i].label}] ${scanCondition}`);
                if (changesSDU.postBalance != changesSDU.preBalance) {
                    console.log(`[${userFleets[i].label}] FOUND: ${changesSDU.postBalance - changesSDU.preBalance}`);
                    userFleets[i].scanSectorStart = Date.now();
                    userFleets[i].scanSkipCnt = 0;
                    //scanTimer = userFleets[i].scanCost > 0 ? 180 : userFleets[i].scanCooldown;
                } else {
                    console.log(`[${userFleets[i].label}] Whomp whomp`);
                }
                console.log(`[${userFleets[i].label}] Date.now(): ${Date.now()}`);
                console.log(`[${userFleets[i].label}] userFleets[i].scanSectorStart: ${userFleets[i].scanSectorStart}`);
                console.log(`[${userFleets[i].label}] diff: ${Date.now() - userFleets[i].scanSectorStart}`);
                let strike = scanCondition < userFleets[i].scanMin && (Date.now() - userFleets[i].scanSectorStart) >= 120000 ? true : false;
                console.log(`[${userFleets[i].label}] strike: ${strike}`);
                userFleets[i].scanSkipCnt = strike ? userFleets[i].scanSkipCnt + 1 : 0;
                let nextMoveIdx = userFleets[i].scanBlockIdx > 2 ? 0 : userFleets[i].scanBlockIdx+1;
                userFleets[i].scanBlockIdx = strike && userFleets[i].scanMove == 'true' ? nextMoveIdx : userFleets[i].scanBlockIdx;
                console.log(`[${userFleets[i].label}] Tools Remaining: ${changesTool.postBalance}`);
                userFleets[i].toolCnt = changesTool.postBalance;
                userFleets[i].sduCnt = changesSDU.postBalance;
                if (userFleets[i].scanSkipCnt < 4) {
                    userFleets[i].state = `Scanning [${scanCondition}%]`;
                    userFleets[i].scanEnd = Date.now() + (userFleets[i].scanCooldown * 1000 + 2000);
                } else {
                    userFleets[i].scanEnd = Date.now() + 600000;
                    userFleets[i].state = `Scanning Paused [${new Date(userFleets[i].scanEnd).toLocaleTimeString()}]`;
                    console.log(`[${userFleets[i].label}] Scanning Paused due to low probability [${new Date(userFleets[i].scanEnd).toLocaleTimeString()}]`);
                    userFleets[i].scanSectorStart = 0;
                    userFleets[i].scanSkipCnt = 0;
                }
                updateAssistStatus(userFleets[i]);
            }
            /*
            setTimeout(() => {
                userFleets[i].state = 'Idle';
                updateAssistStatus(userFleets[i]);
            }, scanTimer * 1000 + 2000);
            */
        } else {
            handleResupply(i, fleetCoords)
        }
    }

    async function handleResupply(i, fleetCoords) {
        let starbaseX = userFleets[i].starbaseCoord.split(',')[0].trim();
        let starbaseY = userFleets[i].starbaseCoord.split(',')[1].trim();

        if (fleetCoords[0] == starbaseX && fleetCoords[1] == starbaseY) {
            console.log(`[${userFleets[i].label}] Docking`);
            userFleets[i].state = 'Docking';
            updateAssistStatus(userFleets[i]);
            await execDock(userFleets[i], userFleets[i].starbaseCoord);
            await wait(2000);
            console.log(`[${userFleets[i].label}] Unloading`);
            userFleets[i].state = 'Unloading';
            updateAssistStatus(userFleets[i]);
            let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let currentSduCnt = fleetCurrentCargo.value.find(item => item.pubkey.toString() === userFleets[i].sduToken.toString())
            if (currentSduCnt && currentSduCnt.account.data.parsed.info.tokenAmount.uiAmount > 0) {
                await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, 'SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM', userFleets[i].starbaseCoord, currentSduCnt.account.data.parsed.info.tokenAmount.uiAmount);
                userFleets[i].sduCnt = 0;
                await wait(2000);
            }
            console.log(`[${userFleets[i].label}] Loading`);
            userFleets[i].state = 'Loading';
            updateAssistStatus(userFleets[i]);
            let currentToolCnt = fleetCurrentCargo.value.find(item => item.pubkey.toString() === userFleets[i].repairKitToken.toString())
            let fleetCurrentFuel = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let currentFuelCnt = fleetCurrentFuel.value.find(item => item.pubkey.toString() === userFleets[i].fuelToken.toString())
            if (userFleets[i].scanCost > 0) {
                await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, userFleets[i].repairKitToken, 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL', repairKitCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].cargoCapacity - currentToolCnt.account.data.parsed.info.tokenAmount.uiAmount);
            }
            fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let currentTool = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL');
            userFleets[i].toolCnt = currentTool ? currentTool.account.data.parsed.info.tokenAmount.uiAmount : 0;
            await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, userFleets[i].fuelToken, 'fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim', fuelCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].fuelCapacity - currentFuelCnt.account.data.parsed.info.tokenAmount.uiAmount);
            userFleets[i].fuelCnt = userFleets[i].fuelCapacity;
            await wait(2000);
            console.log(`[${userFleets[i].label}] Undocking`);
            userFleets[i].state = 'Undocking';
            updateAssistStatus(userFleets[i]);
            await execUndock(userFleets[i], userFleets[i].starbaseCoord);
            await wait(2000);
            userFleets[i].state = 'Idle';
            updateAssistStatus(userFleets[i]);
        } else {
            let moveDist = calculateMovementDistance(fleetCoords, [starbaseX,starbaseY]);
            if (moveDist > 0 && userFleets[i].state.slice(0, 13) !== 'Warp Cooldown') {
                userFleets[i].state = 'Moving';
                updateAssistStatus(userFleets[i]);
                let warpCooldownFinished = await handleMovement(i, moveDist, starbaseX, starbaseY);
                console.log(`[${userFleets[i].label}] Movement finished`);
            } else {
                console.log(`[${userFleets[i].label}] Skipping movement`);
            }
        }
    }

    async function handleMining(i, fleetState, fleetCoords, fleetMining) {
        let destX = userFleets[i].destCoord.split(',')[0].trim();
        let destY = userFleets[i].destCoord.split(',')[1].trim();
        let starbaseX = userFleets[i].starbaseCoord.split(',')[0].trim();
        let starbaseY = userFleets[i].starbaseCoord.split(',')[1].trim();
        let [mineItem] = await sageProgram.account.mineItem.all([
            {
                memcmp: {
                    offset: 105,
                    bytes: userFleets[i].mineResource,
                },
            },
        ]);
        let resourceHardness = mineItem.account.resourceHardness;
        let planets = await getPlanetsFromCoords(destX, destY);
        let sageResource = null;
        let planet = null;
        for (let planetCheck of planets) {
            let resourceCheck = await sageProgram.account.resource.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: planetCheck.publicKey,
                    },
                },
                {
                    memcmp: {
                        offset: 73,
                        bytes: mineItem.publicKey,
                    },
                },
            ]);
            if (sageResource === null && resourceCheck.length > 0) {
                [sageResource] = resourceCheck;
                planet = planetCheck
            }
        }
        let systemRichness = null;
        if (sageResource && sageResource.account) {
            systemRichness = sageResource.account.systemRichness;
        } else {
            let resShort = resourceTokens.concat(r4Tokens).find(r => r.token == userFleets[i].mineResource).name;
            console.log(`[${userFleets[i].label}] ERROR: ${resShort} not found at mining location`);
            userFleets[i].state = `ERROR: ${resShort} not found at mining location`;
            updateAssistStatus(userFleets[i]);
        }

        // fleet PDA
        let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                new solanaWeb3.PublicKey(userFleets[i].mineResource).toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [fleetFoodToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                sageGameAcct.account.mints.food.toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [fleetAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].ammoBank.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                sageGameAcct.account.mints.ammo.toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [fleetCargoAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                sageGameAcct.account.mints.ammo.toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].fuelTank.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim').toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );

        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
        let fleetFuelAcct = currentFuel ? currentFuel.pubkey : fleetFuelToken;
        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
        let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
        let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
        let currentFood = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.food.toString());
        let fleetFoodAcct = currentFood ? currentFood.pubkey : fleetFoodToken;
        let currentFoodCnt = currentFood ? currentFood.account.data.parsed.info.tokenAmount.uiAmount : 0;
        let currentResource = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === userFleets[i].mineResource);
        let fleetResourceAcct = currentResource ? currentResource.pubkey : fleetResourceToken;
        let currentResourceCnt = currentResource ? currentResource.account.data.parsed.info.tokenAmount.uiAmount : 0;
        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
        let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;

        let miningDuration = calculateMiningDuration(userFleets[i].cargoCapacity - cargoCnt, userFleets[i].miningRate, resourceHardness, systemRichness);
        let foodForDuration = Math.max(Math.ceil((miningDuration-10) * (userFleets[i].foodConsumptionRate / 10000)), 0); // Adding less food to ensure that food is completely consumed
        let ammoForDuration = Math.ceil(miningDuration * (userFleets[i].ammoConsumptionRate / 10000));
        ammoForDuration = Math.min(userFleets[i].ammoCapacity, ammoForDuration);

        let distToTarget = calculateMovementDistance(fleetCoords, [destX,destY]);
        let distReturn = calculateMovementDistance([destX,destY], [starbaseX,starbaseY]);
        let fuelNeeded = userFleets[i].planetExitFuelAmount;
        let warpCost = calculateWarpFuelBurn(userFleets[i], distToTarget) + calculateWarpFuelBurn(userFleets[i], distReturn) + userFleets[i].planetExitFuelAmount;
        let halfWarpCost = calculateWarpFuelBurn(userFleets[i], distToTarget) + calculateSubwarpFuelBurn(userFleets[i], distReturn) + userFleets[i].planetExitFuelAmount;
        let subwarpCost = calculateSubwarpFuelBurn(userFleets[i], distToTarget) + calculateSubwarpFuelBurn(userFleets[i], distReturn) + userFleets[i].planetExitFuelAmount;
        if (userFleets[i].moveType == 'warp') {
            fuelNeeded = userFleets[i].planetExitFuelAmount + (userFleets[i].fuelCapacity < warpCost ? userFleets[i].fuelCapacity < halfWarpCost ? subwarpCost : halfWarpCost : warpCost);
        } else {
            fuelNeeded = userFleets[i].planetExitFuelAmount + subwarpCost;
        }

        async function handleMineMovement() {
            if (userFleets[i].moveTarget && userFleets[i].moveTarget !== '') {
                let targetX = userFleets[i].moveTarget.split(',').length > 1 ? userFleets[i].moveTarget.split(',')[0].trim() : '';
                let targetY = userFleets[i].moveTarget.split(',').length > 1 ? userFleets[i].moveTarget.split(',')[1].trim() : '';
                let moveDist = calculateMovementDistance(fleetCoords, [targetX,targetY]);
                if (moveDist > 0) {
                    let warpCooldownFinished = await handleMovement(i, moveDist, targetX, targetY);
                } else {
                    console.log(`[${userFleets[i].label}] Idle`);
                    userFleets[i].state = 'Idle';
                    updateAssistStatus(userFleets[i]);
                }
            } else {
                console.log(`[${userFleets[i].label}] Mining - ERROR: Fleet must start at Target or Starbase`);
                userFleets[i].state = 'ERROR: Fleet must start at Target or Starbase';
                updateAssistStatus(userFleets[i]);
            }
        }

        if (fleetState === 'Idle') {
            console.log(`[${userFleets[i].label}] Mining Status Check`);
            let errorResource = [];
            let needSupplies = false;

            if (currentFuelCnt < fuelNeeded || currentAmmoCnt < ammoForDuration || currentFoodCnt < foodForDuration || cargoCnt > userFleets[i].cargoCapacity * 0.95) {
                needSupplies = true;
            }

            if (needSupplies) {
                if (fleetCoords[0] == starbaseX && fleetCoords[1] == starbaseY) {
                    console.log(`[${userFleets[i].label}] Docking`);
                    userFleets[i].state = 'Docking';
                    updateAssistStatus(userFleets[i]);
                    await execDock(userFleets[i], userFleets[i].starbaseCoord);
                    await wait(2000);
                    console.log(`[${userFleets[i].label}] Unloading`);
                    userFleets[i].state = 'Unloading';
                    updateAssistStatus(userFleets[i]);
                    if (currentResourceCnt > 0) {
                        await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, userFleets[i].mineResource, userFleets[i].starbaseCoord, currentResourceCnt);
                        await wait(2000);
                    }
                    console.log(`[${userFleets[i].label}] Loading`);
                    userFleets[i].state = 'Loading';
                    updateAssistStatus(userFleets[i]);

                    fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
                    miningDuration = calculateMiningDuration(userFleets[i].cargoCapacity - cargoCnt, userFleets[i].miningRate, resourceHardness, systemRichness);
                    let ammoForDuration = Math.ceil(miningDuration * (userFleets[i].ammoConsumptionRate / 10000));
                    ammoForDuration = Math.min(userFleets[i].ammoCapacity, ammoForDuration);
                    foodForDuration = Math.ceil(miningDuration * (userFleets[i].foodConsumptionRate / 10000));

                    if (currentFuelCnt < userFleets[i].fuelCapacity) {
                        console.log(`[${userFleets[i].label}] Loading fuel`);
                        let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, fleetFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].fuelCapacity - currentFuelCnt);
                        if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                            let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                            let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                            let fleetFuelAcct = currentFuel ? currentFuel.pubkey : fleetFuelToken;
                            let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                            if (currentFuelCnt < fuelNeeded) {
                                console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                                errorResource.push('fuel');
                            }
                        }
                        await wait(2000);
                    }
                    if (currentAmmoCnt < ammoForDuration) {
                        console.log(`[${userFleets[i].label}] Loading ammo`);
                        let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
                        let ammoResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].ammoBank, fleetAmmoAcct, sageGameAcct.account.mints.ammo.toString(), ammoCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].ammoCapacity - currentAmmoCnt);
                        if (ammoResp && ammoResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough ammo`);
                            errorResource.push('ammo');
                        }
                        await wait(2000);
                    }

                    if (currentFoodCnt < foodForDuration) {
                        console.log(`[${userFleets[i].label}] Loading food`);
                        let foodCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.food);
                        let foodResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetFoodAcct, sageGameAcct.account.mints.food.toString(), foodCargoTypeAcct, userFleets[i].starbaseCoord, foodForDuration - currentFoodCnt);
                        if (foodResp && foodResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough food`);
                            errorResource.push('food');
                        }
                        await wait(2000);
                    }
                    if (errorResource.length > 0) {
                        userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
                    } else {
                        console.log(`[${userFleets[i].label}] Undocking`);
                        await execUndock(userFleets[i], userFleets[i].starbaseCoord);
                        userFleets[i].state = 'Idle';
                    }
                    updateAssistStatus(userFleets[i]);
                    //await wait(2000);
                    //userFleets[i].moveTarget = userFleets[i].destCoord;
                } else {
                    userFleets[i].moveTarget = userFleets[i].starbaseCoord;
                    handleMineMovement();
                }
            } else if (fleetCoords[0] == destX && fleetCoords[1] == destY) {
                console.log(`[${userFleets[i].label}] Mining Start`);
                userFleets[i].state = 'Mine [' + new Date(Date.now()+(miningDuration * 1000)).toLocaleTimeString() + ']';
                updateAssistStatus(userFleets[i]);
                await execStartMining(userFleets[i], mineItem, sageResource, planet);
            } else {
                userFleets[i].moveTarget = userFleets[i].destCoord;
                handleMineMovement();
            }
        } else if (userFleets[i].state.slice(0, 4) === 'Mine') {
            let mineEnd = (fleetMining.start.toNumber() + miningDuration) * 1000 + 10; // Adding a 10 second buffer to avoid stopping too early
            userFleets[i].state = 'Mine [' + new Date(mineEnd).toLocaleTimeString() + ']';
            updateAssistStatus(userFleets[i]);
            let sageResourceAcctInfo = await sageProgram.account.resource.fetch(fleetMining.resource);
            let mineItem = await sageProgram.account.mineItem.fetch(sageResourceAcctInfo.mineItem);
            if (Date.now() > mineEnd) {
                console.log(`[${userFleets[i].label}] Mining Stop`);
                userFleets[i].state = 'Mining Stop';
                updateAssistStatus(userFleets[i]);
                await execStopMining(userFleets[i], fleetMining.resource, sageResourceAcctInfo, sageResourceAcctInfo.mineItem, mineItem.mint);
                await wait(2000);
                console.log(`[${userFleets[i].label}] Idle`);
                userFleets[i].state = 'Idle';
                updateAssistStatus(userFleets[i]);
            }
            //userFleets[i].moveTarget = userFleets[i].starbaseCoord;
        }
    }

    async function handleTransport(i, fleetState, fleetCoords, fleetResupply) {
        let destX = userFleets[i].destCoord.split(',')[0].trim();
        let destY = userFleets[i].destCoord.split(',')[1].trim();
        let starbaseX = userFleets[i].starbaseCoord.split(',')[0].trim();
        let starbaseY = userFleets[i].starbaseCoord.split(',')[1].trim();
        let moveDist = calculateMovementDistance([starbaseX,starbaseY], [destX,destY]);
        let moveTarget = userFleets[i].moveTarget;
        let fleetSavedData = await GM.getValue(userFleets[i].publicKey.toString(), '{}');
        let fleetParsedData = JSON.parse(fleetSavedData);
        let resource1 = fleetParsedData.transportResource1;
        let resource2 = fleetParsedData.transportResource2;
        let resource3 = fleetParsedData.transportResource3;
        let resource4 = fleetParsedData.transportResource4;
        let targetResources = [fleetParsedData.transportResource1, fleetParsedData.transportResource2, fleetParsedData.transportResource3, fleetParsedData.transportResource4];
        let resource1Perc = fleetParsedData.transportResource1Perc;
        let resource2Perc = fleetParsedData.transportResource2Perc;
        let resource3Perc = fleetParsedData.transportResource3Perc;
        let resource4Perc = fleetParsedData.transportResource4Perc;
        let targetResourceAmounts = [fleetParsedData.transportResource1Perc, fleetParsedData.transportResource2Perc, fleetParsedData.transportResource3Perc, fleetParsedData.transportResource4Perc];
        let starbaseResources = [fleetParsedData.transportSBResource1, fleetParsedData.transportSBResource2, fleetParsedData.transportSBResource3, fleetParsedData.transportSBResource4];
        let starbaseResourceAmounts = [fleetParsedData.transportSBResource1Perc, fleetParsedData.transportSBResource2Perc, fleetParsedData.transportSBResource3Perc, fleetParsedData.transportSBResource4Perc];

        // fleet PDA
        let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].fuelTank.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim').toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [fleetAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].ammoBank.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                sageGameAcct.account.mints.ammo.toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [fleetCargoFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                sageGameAcct.account.mints.fuel.toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );

        if (fleetState === 'Idle') {
            console.log(`[${userFleets[i].label}] Transporting`);
            let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
            let errorResource = [];
            if (fleetCoords[0] == starbaseX && fleetCoords[1] == starbaseY) { // Fleet at starbase?
                console.log(`[${userFleets[i].label}] Docking`);
                userFleets[i].state = 'Docking';
                updateAssistStatus(userFleets[i]);
                await execDock(userFleets[i], userFleets[i].starbaseCoord);
                await wait(2000);
                if (starbaseResourceAmounts[0] > 0 || starbaseResourceAmounts[1] > 0 || starbaseResourceAmounts[2] > 0 || starbaseResourceAmounts[3] > 0) {
                    console.log(`[${userFleets[i].label}] Unloading`);
                    userFleets[i].state = 'Unloading';
                    updateAssistStatus(userFleets[i]);

                    let moreFuel = 0;
                    let moreAmmo = 0;
                    for (let [j, resource] of starbaseResources.entries()) {
                        let resourceAmount = starbaseResourceAmounts[j];
                        if (resource !== '' && resourceAmount > 0) {
                            console.log(`[${userFleets[i].label}] Unloading ${resource}`);
                            let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                            let currentResCnt = currentRes ? currentRes.account.data.parsed.info.tokenAmount.uiAmount : 0;
                            let resAmt = resourceAmount;
                            let resMax = Math.min(currentResCnt, resAmt);
                            if (resMax > 0) {
                                await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, resource, userFleets[i].starbaseCoord, resMax);
                                await wait(2000);
                            }
                            if (resource == sageGameAcct.account.mints.fuel.toString() && resMax < resAmt) moreFuel = resAmt - resMax;
                            if (resource == sageGameAcct.account.mints.ammo.toString() && resMax < resAmt) moreAmmo = resAmt - resMax;
                        }
                    }

                    if (moreFuel > 0) {
                        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resFuelMax = Math.min(currentFuelCnt, moreFuel);
                        if (resFuelMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].fuelTank, sageGameAcct.account.mints.fuel.toString(), userFleets[i].starbaseCoord, resFuelMax);
                            await wait(2000);
                        }
                    }

                    if (moreAmmo > 0) {
                        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resAmmoMax = Math.min(currentAmmoCnt, moreAmmo);
                        if (resAmmoMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].ammoBank, sageGameAcct.account.mints.ammo.toString(), userFleets[i].starbaseCoord, resAmmoMax);
                            await wait(2000);
                        }
                    }
                }
                console.log(`[${userFleets[i].label}] Refueling`);
                userFleets[i].state = 'Refueling';
                updateAssistStatus(userFleets[i]);
                let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                let fleetFuelAcct = currentFuel ? currentFuel.pubkey : fleetFuelToken;
                let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                if (currentFuelCnt < userFleets[i].fuelCapacity) {
                    let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, fleetFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].fuelCapacity - currentFuelCnt);
                    if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                        console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                        errorResource.push('fuel');
                    }
                    await wait(2000);
                }
                let fuelNeeded = 0;
                if (userFleets[i].moveType == 'warp') {
                    fuelNeeded = Math.ceil(calculateWarpFuelBurn(userFleets[i], moveDist) * 2);
                } else {
                    fuelNeeded = Math.ceil(calculateSubwarpFuelBurn(userFleets[i], moveDist) * 2);
                }
                fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
                let cargoSpace = userFleets[i].cargoCapacity - cargoCnt;
                if (fuelNeeded > userFleets[i].fuelCapacity) {
                    let currentFuel = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let fleetCargoFuelAcct = currentFuel ? currentFuel.pubkey : fleetCargoFuelToken;
                    let cargoFuelAmt = calculateSubwarpFuelBurn(userFleets[i], moveDist) - currentFuelCnt;
                    if (cargoFuelAmt > 0 && cargoSpace > cargoFuelAmt) {
                        cargoSpace -= cargoFuelAmt;
                        cargoCnt += cargoFuelAmt;
                        let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetCargoFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].starbaseCoord, cargoFuelAmt);
                        if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                            errorResource.push('fuel');
                        }
                    } else {
                        errorResource.push('fuel');
                    }
                }
                if (errorResource.length == 0) {
                    userFleets[i].state = 'Loading';
                    updateAssistStatus(userFleets[i]);

                    let resAmmo = targetResources.indexOf(sageGameAcct.account.mints.ammo.toString());
                    let extraAmmo = 0;
                    if (resAmmo > -1) {
                        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                        let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
                        let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
                        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resAmmoAmt = targetResourceAmounts[resAmmo];
                        let resAmmoMax = Math.min(userFleets[i].ammoCapacity, resAmmoAmt);
                        if (currentAmmoCnt < resAmmoMax) {
                            await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].ammoBank, fleetAmmoAcct, sageGameAcct.account.mints.ammo.toString(), ammoCargoTypeAcct, userFleets[i].starbaseCoord, resAmmoMax - currentAmmoCnt);
                            await wait(2000);
                        }
                        if (resAmmoMax < resAmmoAmt) extraAmmo = resAmmoAmt - resAmmoMax;
                    }

                    let resFuel = targetResources.indexOf(sageGameAcct.account.mints.fuel.toString());
                    let extraFuel = fuelNeeded > userFleets[i].fuelCapacity ? 0 : userFleets[i].fuelCapacity - fuelNeeded;

                    for (let [j, resource] of targetResources.entries()) {
                        let resourceAmount = targetResourceAmounts[j];
                        if (resource !== '' && resourceAmount > 0) {
                            console.log(`[${userFleets[i].label}] Loading ${resource}`);
                            let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                                [
                                    userFleets[i].cargoHold.toBuffer(),
                                    new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                                    new solanaWeb3.PublicKey(resource).toBuffer()
                                ],
                                new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
                            );
                            let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                            let fleetResAcct = currentRes ? currentRes.pubkey : fleetResourceToken;
                            let resCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resource);
                            let resAmt = resourceAmount;
                            if (resource == sageGameAcct.account.mints.ammo.toString()) resAmt = extraAmmo;
                            if (resource == sageGameAcct.account.mints.fuel.toString()) resAmt = resourceAmount - extraFuel;
                            let resMax = Math.min(cargoSpace, resAmt);
                            if (resMax > 0) {
                                cargoSpace -= resMax;
                                let resp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetResAcct, resource, resCargoTypeAcct, userFleets[i].starbaseCoord, resMax);
                                if (resp && resp.name == 'NotEnoughResource') {
                                    let resShort = resourceTokens.concat(r4Tokens).find(r => r.token == resource).name;
                                    console.log(`[${userFleets[i].label}] ERROR: Not enough ${resShort}`);
                                    errorResource.push(resShort);
                                }
                                await wait(2000);
                            }
                        }
                    }
                }
                if (errorResource.length > 0) {
                    userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
                } else {
                    console.log(`[${userFleets[i].label}] Undocking`);
                    userFleets[i].state = 'Undocking';
                    await execUndock(userFleets[i], userFleets[i].starbaseCoord);
                    await wait(2000);
                }
                updateAssistStatus(userFleets[i]);
                userFleets[i].moveTarget = userFleets[i].destCoord;
            }
            if (fleetCoords[0] == destX && fleetCoords[1] == destY) {
                console.log(`[${userFleets[i].label}] Docking`);
                userFleets[i].state = 'Docking';
                updateAssistStatus(userFleets[i]);
                await execDock(userFleets[i], userFleets[i].destCoord);
                await wait(2000);
                //if (targetResourceAmounts[0] > 0 || targetResourceAmounts[1] > 0 || targetResourceAmounts[2] > 0 || targetResourceAmounts[3] > 0) {
                    userFleets[i].state = 'Unloading';
                    updateAssistStatus(userFleets[i]);

                    let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});

                    //let warpCost = calculateWarpFuelBurn(userFleets[i], moveDist);
                    //let subwarpCost = calculateSubwarpFuelBurn(userFleets[i], moveDist);
                    //let extraFuel = (currentFuelCnt + currentCargoFuelCnt) - Math.ceil(subwarpCost);
                    //if (userFleets[i].moveType == 'warp' && currentFuelCnt + currentCargoFuelCnt > warpCost) {
                    //    extraFuel = (currentFuelCnt + currentCargoFuelCnt) - Math.ceil(warpCost);
                    //}
                    //console.log('Current Fuel: ', currentFuelCnt);
                    //console.log('Current Cargo Fuel: ', currentCargoFuelCnt);
                    //console.log('Warp Cost: ', warpCost);
                    //console.log('Subwarp Cost: ', subwarpCost);
                    //console.log('Extra Fuel: ', extraFuel);

                    let extraAmmo = 0;
                    let extraFuel = 0;
                    for (let [j, resource] of targetResources.entries()) {
                        let resourceAmount = targetResourceAmounts[j];
                        if (resource !== '' && resourceAmount > 0) {
                            console.log(`[${userFleets[i].label}] Unloading ${resource}`);
                            let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                            let currentResCnt = currentRes ? currentRes.account.data.parsed.info.tokenAmount.uiAmount : 0;
                            let resAmt = resource == sageGameAcct.account.mints.fuel.toString() ? currentResCnt : resourceAmount; // Empty all fuel from Cargo. This needs to be moved to FuelTank for the return trip
                            let resMax = Math.min(currentResCnt, resAmt);
                            if (resMax > 0) {
                                await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, resource, userFleets[i].destCoord, resMax);
                                await wait(2000);
                            }
                            if (resource == sageGameAcct.account.mints.fuel.toString()) extraFuel = resourceAmount - resMax;
                            if (resource == sageGameAcct.account.mints.ammo.toString()) extraAmmo = resAmt - resMax;
                        }
                    }

                    fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let currentCargoFuel = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let currentCargoFuelCnt = currentCargoFuel ? currentCargoFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    console.log(`[${userFleets[i].label}] DEBUG - fleetCurrentCargo: ${fleetCurrentCargo}`);
                    console.log(`[${userFleets[i].label}] DEBUG - fuel.toString: ${sageGameAcct.account.mints.fuel.toString()}`);
                    console.log(`[${userFleets[i].label}] DEBUG - currentCargoFuelCnt: ${currentCargoFuelCnt}`);
                    if (currentCargoFuelCnt > 0) {
                        await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, sageGameAcct.account.mints.fuel.toString(), userFleets[i].destCoord, currentCargoFuelCnt);
                    }

                    extraFuel = targetResources.indexOf(sageGameAcct.account.mints.fuel.toString()) > -1 ? extraFuel : 0;
                    if (extraFuel > 0) {
                        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resFuelMax = Math.min(currentFuelCnt, extraFuel);
                        if (resFuelMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].fuelTank, sageGameAcct.account.mints.fuel.toString(), userFleets[i].destCoord, resFuelMax);
                            await wait(2000);
                        }
                    }

                    if (extraAmmo > 0) {
                        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resAmmoMax = Math.min(currentAmmoCnt, extraAmmo);
                        if (resAmmoMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].ammoBank, sageGameAcct.account.mints.ammo.toString(), userFleets[i].destCoord, resAmmoMax);
                            await wait(2000);
                        }
                    }
                //}
                userFleets[i].state = 'Loading';
                updateAssistStatus(userFleets[i]);

                let resAmmo = starbaseResources.indexOf(sageGameAcct.account.mints.ammo.toString());
                extraAmmo = 0;
                if (resAmmo > -1) {
                    let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                    let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                    let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
                    let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
                    let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let resAmmoAmt = starbaseResourceAmounts[resAmmo];
                    let resAmmoMax = Math.min(userFleets[i].ammoCapacity, resAmmoAmt);
                    if (currentAmmoCnt < resAmmoMax) {
                        console.log(`[${userFleets[i].label}] Loading Ammo`);
                        await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].ammoBank, fleetAmmoAcct, sageGameAcct.account.mints.ammo.toString(), ammoCargoTypeAcct, userFleets[i].destCoord, resAmmoMax - currentAmmoCnt);
                        await wait(2000);
                    }
                    if (resAmmoMax < resAmmoAmt) extraAmmo = resAmmoAmt - resAmmoMax;
                }

                let warpCost = calculateWarpFuelBurn(userFleets[i], moveDist);
                let subwarpCost = calculateSubwarpFuelBurn(userFleets[i], moveDist);
                let fuelNeeded = Math.ceil(subwarpCost);
                if (userFleets[i].moveType == 'warp' && userFleets[i].fuelCapacity > warpCost) {
                    fuelNeeded = Math.ceil(warpCost);
                }

                fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                let fuelCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.fuel);
                let fleetFuelAcct = currentFuel ? currentFuel.pubkey : fleetFuelToken;
                currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                if (fuelNeeded > currentFuelCnt) {
                    console.log(`[${userFleets[i].label}] Refueling`);
                    let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, fleetFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].destCoord, fuelNeeded - currentFuelCnt);
                    if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        if (currentFuelCnt < Math.ceil(subwarpCost)) {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                            errorResource.push('fuel');
                        }
                    }
                    await wait(2000);
                }

                fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')});
                let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
                let cargoSpace = userFleets[i].cargoCapacity - cargoCnt;

                for (let [j, resource] of starbaseResources.entries()) {
                    let resourceAmount = starbaseResourceAmounts[j];
                    if (resource !== '' && resourceAmount > 0) {
                        console.log(`[${userFleets[i].label}] Loading ${resource}`);
                        let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                            [
                                userFleets[i].cargoHold.toBuffer(),
                                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                                new solanaWeb3.PublicKey(resource).toBuffer()
                            ],
                            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
                        );
                        let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                        let fleetResAcct = currentRes ? currentRes.pubkey : fleetResourceToken;
                        let resCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resource);
                        let resAmt = resource == sageGameAcct.account.mints.ammo.toString() ? extraAmmo : resourceAmount;
                        let resMax = Math.min(cargoSpace, resAmt);
                        if (resMax > 0) {
                            cargoSpace -= resMax;
                            let resp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetResAcct, resource, resCargoTypeAcct, userFleets[i].destCoord, resMax);
                            if (resp && resp.name == 'NotEnoughResource') {
                                let resShort = resourceTokens.concat(r4Tokens).find(r => r.token == resource).name;
                                console.log(`[${userFleets[i].label}] ERROR: Not enough ${resShort}`);
                                errorResource.push(resShort);
                            }
                            await wait(2000);
                        }
                    }
                }
                if (errorResource.length > 0) {
                    userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
                } else {
                    console.log(`[${userFleets[i].label}] Undocking`);
                    userFleets[i].state = 'Undocking';
                    await execUndock(userFleets[i], userFleets[i].destCoord);
                    await wait(2000);
                }
                updateAssistStatus(userFleets[i]);
                userFleets[i].moveTarget = userFleets[i].starbaseCoord;
            }
            if (errorResource.length > 0) {
                userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
            } else {
                if (userFleets[i].moveTarget !== '') {
                    let targetX = userFleets[i].moveTarget.split(',').length > 1 ? userFleets[i].moveTarget.split(',')[0].trim() : '';
                    let targetY = userFleets[i].moveTarget.split(',').length > 1 ? userFleets[i].moveTarget.split(',')[1].trim() : '';
                    moveDist = calculateMovementDistance(fleetCoords, [targetX,targetY]);
                    console.log(`[${userFleets[i].label}] Debug - moveTarget: ${userFleets[i].moveTarget}, moveDist: ${moveDist}, targetX: ${targetX}, targetY: ${targetY}`);
                    let warpCooldownFinished = await handleMovement(i, moveDist, targetX, targetY);
                } else {
                    console.log(`[${userFleets[i].label}] Transporting - ERROR: Fleet must start at Target or Starbase`);
                    userFleets[i].state = 'ERROR: Fleet must start at Target or Starbase';
                    updateAssistStatus(userFleets[i]);
                }
            }
            updateAssistStatus(userFleets[i]);
        }
    }

    let iterCnt = 1;
    async function startAssistant() {
        if (enableAssistant) {
            for (let i=0, n=userFleets.length; i < n; i++) {
                if(userFleets[i].busy) continue;
                try {
                    let fleetSavedData = await GM.getValue(userFleets[i].publicKey.toString(), '{}');
                    let fleetParsedData = JSON.parse(fleetSavedData);
                    let fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
                    let [fleetState, extra] = getFleetState(fleetAcctInfo);
                    let fleetCoords = fleetState == 'Idle' ? extra : [];
                    let fleetMining = fleetState == 'MineAsteroid' ? extra : [];
                    userFleets[i].startingCoords = fleetCoords;
                    if (userFleets[i].state == 'MoveWarp' || userFleets[i].state == 'MoveSubwarp') {
                        handleMovement(i, null, null, null);
                    }
                    /*
                    if (fleetParsedData.assignment == 'Scan' && readyToScan && userFleets[i].state === 'Idle') { // change to fleetState == 'Idle'
                        console.log(`[${userFleets[i].label}] Scanning`);
                        let destCoords = userFleets[i].scanBlock[userFleets[i].scanBlockIdx];
                        handleScan(i, fleetCoords, destCoords);
                    } else if (fleetParsedData.assignment == 'Scan' && userFleets[i].state === 'Idle') {
                        console.log(`[${userFleets[i].label}] Resupplying`);
                        handleResupply(i);
                     */
                    if (fleetParsedData.assignment == 'Scan' && fleetState == 'Idle') {
                        console.log(`[${userFleets[i].label}] Scanning`);
                        let destCoords = userFleets[i].scanBlock[userFleets[i].scanBlockIdx];
                        handleScan(i, fleetCoords, destCoords);
                    } else if (fleetParsedData.assignment == 'Mine') {
                        if (userFleets[i].state.slice(0, 5) !== 'ERROR') {
                            handleMining(i, userFleets[i].state, fleetCoords, fleetMining);
                        }
                    } else if (fleetParsedData.assignment == 'Transport') {
                        if (userFleets[i].state.slice(0, 5) !== 'ERROR') {
                            handleTransport(i, userFleets[i].state, fleetCoords, fleetParsedData.resupply);
                        }
                    }
                } catch (err) {
                    console.log('ERROR: ', err);
                }
                await wait(100);
                updateAssistStatus(userFleets[i]);
            }
            //console.log('Iter: ', iterCnt);
            setTimeout(startAssistant, 20000);
            iterCnt++;
        };
    }

    async function toggleAssistant() {
        let autoSpanRef = document.querySelector('#autoScanBtn > span');
        if (enableAssistant === true) {
            enableAssistant = false;
            autoSpanRef.innerHTML = 'Start';
        } else {
            enableAssistant = true;
            startAssistant();
            autoSpanRef.innerHTML = 'Stop';
            for (let i=0, n=userFleets.length; i < n; i++) {
                let fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
                let [fleetState, extra] = getFleetState(fleetAcctInfo);
                let fleetCoords = fleetState == 'Idle' && extra ? extra : [];
                userFleets[i].startingCoords = fleetCoords;
                userFleets[i].state = fleetState;
            }
        }
    }

    function makeDraggable(elem) {
        const elemHeader = elem.querySelector('.assist-modal-header');
        let originalX, originalY, elementX, elementY;
        function dragElem(e)
        {
            elementY = elementY + e.clientY - originalY;
            elementX = elementX + e.clientX - originalX;
            originalY = e.clientY;
            originalX = e.clientX;
            elem.style.top = elementY + "px";
            elem.style.left = elementX + "px";
            elem.style.right = 'auto';
            elem.style.bottom = 'auto';
        }
        elemHeader.addEventListener('mousedown', function(e) {
            e.preventDefault();
            originalX = e.clientX;
            originalY = e.clientY;
            elementX = elem.offsetLeft;
            elementY = elem.offsetTop;

            window.addEventListener('mousemove', dragElem, false);

            window.addEventListener('mouseup', () => {
                window.removeEventListener('mousemove', dragElem, false);
            }, false);

        }, false);
    }

    let observer = new MutationObserver(waitForLabs);
    function waitForLabs(mutations, observer){
        let elemTrigger = observer ? '#root > div:first-of-type > div:first-of-type > div > header > h1' : 'body';
        //if(document.querySelectorAll('#root > div:first-of-type > div:first-of-type > div > header > h1').length > 0 && !document.getElementById("autoScanBtn")) {
        //if(document.querySelectorAll('body').length > 0 && !document.getElementById("autoScanBtn")) {
        if(document.querySelectorAll(elemTrigger).length > 0 && !document.getElementById("assistContainer")) {
            document.getElementById("assistContainerIso") && document.getElementById("assistContainerIso").remove();
            observer && observer.disconnect();
            let assistCSS = document.createElement('style');
            assistCSS.innerHTML = '.assist-modal {display: none; position: fixed; z-index: 2; padding-top: 100px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);} .assist-modal-content {position: relative; display: flex; flex-direction: column; background-color: rgb(41, 41, 48); margin: auto; padding: 0; border: 1px solid #888; width: 785px; min-width: 450px; max-width: 75%; height: auto; min-height: 50px; max-height: 85%; overflow-y: auto; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19); -webkit-animation-name: animatetop; -webkit-animation-duration: 0.4s; animation-name: animatetop; animation-duration: 0.4s;} #assist-modal-error {color: red; margin-left: 5px; margin-right: 5px; font-size: 16px;} .assist-modal-header-right {color: rgb(255, 190, 77); margin-left: auto !important; font-size: 20px;} .assist-btn {background-color: rgb(41, 41, 48); color: rgb(255, 190, 77); margin-left: 2px; margin-right: 2px;} .assist-btn:hover {background-color: rgba(255, 190, 77, 0.2);} .assist-modal-close:hover, .assist-modal-close:focus {font-weight: bold; text-decoration: none; cursor: pointer;} .assist-modal-btn {color: rgb(255, 190, 77); padding: 5px 5px; margin-right: 5px; text-decoration: none; background-color: rgb(41, 41, 48); border: none; cursor: pointer;} .assist-modal-save:hover { background-color: rgba(255, 190, 77, 0.2); } .assist-modal-header {display: flex; align-items: center; padding: 2px 16px; background-color: rgba(255, 190, 77, 0.2); border-bottom: 2px solid rgb(255, 190, 77); color: rgb(255, 190, 77);} .assist-modal-body {padding: 2px 16px; font-size: 12px;} .assist-modal-body > table {width: 100%;} .assist-modal-body th, .assist-modal-body td {padding-right: 5px, padding-left: 5px;} #assistStatus {background-color: rgba(0,0,0,0.4); opacity: 0.75; backdrop-filter: blur(10px); position: absolute; top: 80px; right: 20px; z-index: 1;} #assistCheck {background-color: rgba(0,0,0,0.75); backdrop-filter: blur(10px); position: absolute; margin: auto; left: 0; right: 0; top: 100px; width: 650px; min-width: 450px; max-width: 75%; z-index: 1;} .dropdown { position: absolute; display: none; margin-top: 25px; margin-left: 152px; background-color: rgb(41, 41, 48); min-width: 120px; box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2); z-index: 2; } .dropdown.show { display: block; } .assist-btn-alt { color: rgb(255, 190, 77); padding: 12px 16px; text-decoration: none; display: block; background-color: rgb(41, 41, 48); border: none; cursor: pointer; } .assist-btn-alt:hover { background-color: rgba(255, 190, 77, 0.2); } #checkresults { padding: 5px; margin-top: 20px; border: 1px solid grey; border-radius: 8px;} .dropdown button {width: 100%; text-align: left;} #assistModal table {border-collapse: collapse;} .assist-scan-row, .assist-mine-row, .assist-transport-row {background-color: rgba(255, 190, 77, 0.1); border-left: 1px solid white; border-right: 1px solid white; border-bottom: 1px solid white} .show-top-border {background-color: rgba(255, 190, 77, 0.1); border-left: 1px solid white; border-right: 1px solid white; border-top: 1px solid white;}';

            let assistModal = document.createElement('div');
            assistModal.classList.add('assist-modal');
            assistModal.id = 'assistModal';
            assistModal.style.display = 'none';
            let assistModalContent = document.createElement('div');
            assistModalContent.classList.add('assist-modal-content');
            let iconStr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAA4CAYAAABNGP5yAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiIAAC4iAari3ZIAAAAHdElNRQfnCwMTJgKRQOBEAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjOM5pdQAAAZdklEQVRoQ91aB3RUx9Vebe/alXa1fVVWXVr1hgoqICEhikQngOjFBmyQKKJ3CBgDQoAwotqAQPQuwKaDsbExGGzAGLCBALYJcQCbkJB8/523u4Cd5JycnPxAMud8mnnzptz73Tt3Zp6W96JSQkKCyemM6hMfF7ekUaOMI5kZjb/OSM++1ahR5u3ExNRzTmfc9ujomCmNGzduXlhYKHF3++9O7du3FyTHxxdGR0duz8zMeFJcXIy2bdqiTWkblJaWIDu7MYqKmhGK0KxZAbKyshAfn0CIv5eYmDg3NzfX3z3Uf18iS+bGOWPPNUpLA1O8VatWKC0p5VBSUsI9k5Jo2rQpKd8M+fn5yMvLIxIaI436xMbGIiIi4rHT6XybnmXuYV/9REqJmPWindF/a0IKFRUVolXLlihp3ZoUL0Xr1iVo2bIVZ/UuXbogNTWVFM/lkJ2TjcysDDRqlIbk5GTmCQgPD0dgYOAZIiTAPcWrm9q1ayeLiXHuZdZr0iQXRc3y0YIR0KIYrRkJrVpg8KD+mDdvJmbMmIw1a9ejU6cOWL58EUaNqkBBfh7SUlOQkpzKEUBxA3FxcYgIC4fFbL5D5Vj3VK9eys7OFkaGh21NSohHXm4OmhEBxYyAwmYoJcUXVL+Fq1c/x63bF7FrVx0GERE1S1fizfJyzJo1CSdP7se9u19j3apqFORkIIFiQQJ5QHxsHOJiYhAVEQmLyUQBM9HunvLVSkFBAWNjnU7kZmehaW42CvIITXLQp3tnnDtzGJ+fOUou3w4KhRxeXl7o2K03ftOjD9as3wA+34tDSEgQFlVPxfUvtuL1bgWIjYxGrDPGDYoJoeEwGU0nGdnuaV+NFBYWEBbiCPpTVnoGsjMzkZuVSXkGendvi6tfHcGk8SMgl0s5xRkEQhHWb9+P5LR07P3gECKjokDDgOd+nxgfgQ/3zEBl30JEhoXBGRmJmCgnh8CAIFit1rGumV+RZDabdiYnJSEjrREyKYBlNEpGmxaZ+PL0JpR1bUPW5XOKaTRaKJVK5OUXo25rA5GiwKA3hmDh4iXcewp2lLvaWo067FwxEH3bJiMsJIyICEd0RDSiwqNgMph/TkpKsrmnf7nJZjNEBQc7/ppCQSuVISkRGSnx2LlqMAYNKOGU4fG8IJZIUDV/AXR6IzZs34dARwgEAgFn9amz3kajjEyMGj0WTnJ11sfLi4cIhxEH3u2O9LhghDpCER4SzsER4IC/zb/aLcLLTQa97xK29hMpYCXGxyIxNgZv9MzF5tqBEIkFbmW80HfAYKxcuwmzq2rQjda+hAgZP2UKfHU6yBVKrFq3ESPHTsDOvfugUquf9ivvkYIZg7MQZA9EcFAIR0RYcBgFRMuPFAukbjFeTqK1KLNbLT+yNRobTQErOgrxzghsWdAFbfLjOAV4FNzMVisOnfgEn1+8gpWr14FPlm/bqSN5wg7MrV7AeUdSSiOcvXAZn5w9hz4DXn9KQKDZG9tm5yEi0IJAIiGIrB8cGAyrycrIaO0W5eUki8VQ7AgIoHUZQdtUBCLp0NIi24mDK3pAp34W9AYPqcC5C19hdd16WIgMk9lM3lBHHjAV2xsaMHb8eGrHR+eu3bD/gwPYe+AQpDK2W/AgJAIXvxmDNlmBsJltsFsDOCICbAEE+xq3KC8n2czmWor+CKdIzbao0GAHKrolYvPs1hCR4Gx9M2tXL6xBQGDQU0JGjBmDhbXLIBSLIZPLUdyiBUJCQ7mdgMWF0nYdEJ+UwrXlE0a2C8SYDkHQ+/rAYjTDbrGzGECwX3dJ8pKSv9VyxRFELulwICstGZX9S1E3KRfLx+dzgjMFTGYTho+sdG1zhHg6/7+3cSMWEQEpqWncDuF554GFrNvuN93chPHRL9+EFYP8MXVoUxQ1SYHRz0DeYIHNYn0SHBz8cm6OYWFhKrvF+igwgNzR3x8GvQ/aFTfG6mmFWFyZ/ZQAutCAjshPlRMKhUhv3JgIqMWJj09h4+YtaEM3RDF5g6eNQuWNsv7P4kDvpkZsrIzA+KFtYfDVwM/XlzzBBCuREBMaGkh9XnwixfyJgCdMeX+7HUa9HxTkzqWNjFg5JoOWgGs/12q1dALs/FQ5D9jSyKHL0vZdu/HD7+/i0qVL3OWHvTOZzMjMzoMXLSM2RkVLEyZ0tEEqFkKj9ubmMhMBFmpHhkiiPi8+hYaGxpAF/urvIcBggFqlQohBgdWVCbD4uIIg84TBfTtAqZBxypHA3GGIlRkWLlqE+w8eYN26dZx3sLri3AQoZa7+UqEXFvY0oiSRDlE0hi8RavTz45Q3G4wIcziaUZ8XnyJCQrKYEIwA5gVWiuw+Gg0UIjHKi23okmPklPdWyjCxXzoGdMzhzvs+Pj6oIfevHD0GzYuLcevObex7fz+dCuWc8vFhBgxpbUNKuJkjIDVIippuGoQTsd5EsI76mygGsLlNRHpIUFCpS6IXnEIdjkKTwUQEUES2+1NAslCU1kAuFSPcT4qpnazQq8XITQ7EtH7xmDM4HX065XFK2shjDhw+gm9v3sTJjz/iDkOs3mHTYVQHO4aVmtC70AGVRIgp7VXokqKBViaDD3mOzlfHKc4IYMEwKCioMyfQi060BPKIgL/Z7TZuCVhIqCCzD5KMUqhEAqQHSDAgX4832oRjUlkEqsqbok+XEk5Rhmg6PR45dgwBdI7w1AXSODOGdsTIUhteKzDitXwzOibKoZOJEGdRI8ziAx8i2Wg0cgQYaCnQ/aEr9X3xKTSIEWBkNzPYbDZySyMdaRXIDNIiTi+GWCBERpgK5W0DMHtYKebMnIHJ02chJ7cJZGRNGuIXkZ8tpUGDBmHBvCrMquyH3vkByApXQEGBL0gjRockM2QSMXx9fH9BgD3Q/tIIKDKS0owAO/MAi5XWtxZysQRRdl8YVDL0amLDvNE9kENXZLbfFxQ2R139JuzYuYc7G7Ro0RJlZd1RSzHh8OHDqKyshJbiiN1ixpTyXujdPA4GOlEm+GuhVUigJoINev3THYARYLFYXg4BdCNrxdag1UoHEvIARgSzjFqtgIRIyItSY2KpGvnRVCeXcAGN3QolEhkyshpjwMDBqFu/ARUVw1Ba2gYGWkKsDbdzULDMjLJiNMWC4ngdREIRVHR11mmfBUAGPyLjpREQHBjYxagnAij4eQgw06lPr9chyKDCuGIFJreQYWyxFuPaBsHf7PtUQRf4mDBhMncrfL5eLpWieYoFA/N9MaxQi+GFGjj0cm6H8ez/7ADEEaAjbzCbu7tFerEpxOEoM+j8/saUZgRwJNAyMPn5IjtMiWS7lCK3EEqREIVOb8x8IwOFTVIhED67Ik8kAsS0rmk47jk2JhzlZWnomEmurZFCTn1DjHJkhWmhJwKY8uwI7CFARydCIqCXS6IXnGj/7eTnq39iNtFWyHYCIoDBavCD3lsNrUoJNQU7KV8ACSln10owsndjrFw6G4XNirhDz1i6/zMPoB0FU6eMwaTRXZEeaYA3kaSkmKGiIKkm19co1TDofLmt1m4lsoloRoAvnQnI83q6Rfr30p/uX239+OGNsscPb/d8RHjy6Lsejz3gnm/3fPzwm94MTx5e7/X4j9d6PfrD5T7b6muXjRwy4K+jhg3EuMo3Mb5yCCaNKiclhmLC6HIO46iucXIsNOTuDCoio1G0A+8SCdu31WPh4sWYMGky1m9Yhya5qdCKRPAlxf2oncVbhQH9emN4xVBUDi/HmMphGDdmOCaOHcFhwphhVDcUWzesWvHo/u/6PH54s5dHB1Z2ye3Go+8Id9m73o8e3enz6OGdvo8f3ej74N75Lrw//3jkx7Mf1uLo3kU4vv8dDsf2EfYy1OBowyIc3rMIh3ZX49CuKhzcOY/LD1F+cOccHCAc2k3lXVS/ey4ON8wjVNF41Th58B1sem8mrCoF9BTY9ESCj4BOh6RkTnIc6jbUo0ePHvCRyqH1EsKP3vtRO52Aj3FDymjeWpJnBU5+sJLDiX0rSKblONJQS3MtxqE9NZQvIhkXk8w1OL5vEb1fSHMvpDYLSM5qkm8Bhw92VhMWYP/2+di3dS7OfrgMP/3w0e95f/79lvstGoeQhQTQEPNaEk5LuYZyF1z1Lni561xtfChnFmNgZRcE8KWxdFTWUdmPcqaUgXIOpBxT1F9Kt8LYGOjo6KzjFHe/59qz8b2gplxDxHCyURs2rw/lTEY2l5bKXM7aERixTEZvrq8LrI61Y23YmCxndT1L0vDohwM3eX++W3+vONPBCa1nwpGFOCEJzBJ64fOgNgQdlT3vuNwNVmaKs74eZYxUNtLNj8FTx2ChA46JwNrrn6vnwPoTPGPqqa8fzcXesbF/Md9z8CX4kJKcIViZdGHP3Bz07ILLyF2Kk/Hwzm4i4Pu6u8WZwZwVWQNuciq7BCC35eARxA0a1GNVl4Vd8Dyz3EjW50Dtnyrvzj1KGCnKP2v/HH5FFteG2rP+T2Xg4JKPKejLPM8NzgsJv5D5OTBiOhcm4sGt7dd5j+8svVtCHuAn5MFIV0+TyAuBagmmDczBuxOb4b2JTbF2WgFWT8zG2slNUDetGOtmtEDPokhqz8eKSZnYWV2E3Us6w18uRk6EHbuq22LTrFJsm9MBr5XEu0lwYerrBdhd0w17l/VG79JsTtniRDP2vZOP3Yta482OqVTn5WpPJDN4jMLaBiolWDMlAHWT9HhvrBbRdPdgBtERcqJN2FPdFHuqaKw5OYQMNFTnYcfsbGx/Ow/zh2eRfuRNIj66FsXjj9c33+D96cZvv2uT4Q+zxAsWqResMi/kRvniq3V6nFsqxZnFIny7LQhfr9Hjymojrq214Hq9AbP60sGHyDryjgNHZslwelkALPRsJhKrB5rx2VIdTi3yxskaK6J9pVx900gTTlRb8eF8MXbPVcFG5wSmVMdGPvhqvQFHZ8tQ2ZH2eCLAQuQymKls4gzD54zTv3UA9owRYdsIAXaPFmB0VwNnCBOhbZIvLi4T4GqdBJffk+Grd+W4Uq/G+eUSnF8px1XSI8RbBJuUjx50zP7xWt0N3sPPut9pn6qHXe5FFiTrK7zQItmEazssOL/WG5c2mVA9KAFzB8SiZng8lk1MR82INLRJs8NGpO2db8TxOVJ8vNhMgY0FNy+EewtweL4Jn9RoCSpUvWZFkEyADROj8P4kAU5UydA8XklLgBQktE1W48u1Ghx7W4qR7QywUZ1dLIA/gStLXPAnHKgNw95xfOyfLMXhKQLsn0uXMZrXLhWgQ4ofztQIcHqtEtO6i7GT2pyYJyVjqHDqHRm+aQhDrEECB+nYq3kk7l2cf4N3ZXPK7Q6JaoSovTiEq/nIjdDg4gYb9k9kLEuwZYgUm4dIsHucGIdmSXFohgiTOhgRrOBjx0wNTi0U4+wKK0JpYAeR6CAvyguW4NQSEmiJD75YpcPSYQk4OFOJw78VYGpvLaxiUl5Mlia0SVLgC7LYp4skGNPRgEAiMZDGCKKxGLgxCW3T1bi2y0okCnFzZyFOzxfhwnIliuM0NDcfHZN12PCmGPUk79rXJVjdV4K6flJsLRcTaQJ8u9eJWL2QDMSni5oF3x7reIN3cLbxVod4GbmpAE5CjK8QKVY51k8PxroRGtS9oaKB5FhRJsfSblIs6SrFnDYilBfqEKYmgt7S4NxKKS7Q0ggj8kKVLoQoieWmCpxZ5kskKGk5aHFgBllluhKhGrIsKcmWnJ28qH2qEhfXynD+XSnGdzGSsjzOSiGEUKUAYTReGI1XP9uCz2q9cewtJVaOTsM3G/xxboEXFr7pB6eGxkn0xvz2IrzTVYZlJO/K7nIs66nAzN+oMaGjL8pyfRDLdPQRolumGkdqw27zNoxQ3eyUKEeyUYxEsxRlBdHoVRiF/i2j8VrrCAztEI214xOxe6Q3tlcosHWoiiaQYkiBllN47zwfXN6gxtWtUYj3o6urUYEksxJJFhWifCVYMESPs7UaHH1bwXlPuxQZAsiVGWzuvHO6El9vVOLaZl9M6+WAUydDvEGBZJMKqTROOBGd6S/CDwfN+GiOHDummpHlL8X1nak4v5iPMyt0SDEK0DnFBzVdxFjSTYJawvIyKdb0Jg+okOHwTBU+q49DoknMfa9on6LA+lGGW7y64crbyQ45BHRel9Aef2FrEU7XGPExKfbhbDWOkdsenChDwwhyI1oO+8fJ8V4/Cfo11YJPl5id8yjgLVPg0toAXN6Ujqvbc3FlWzaubc/CrPIUut3xcbjagB1jxNgySgxvhZDrx+DlzgsztTi3SkmepMXljXG4siWHxskjZOPGnkIYdUqM6aPFN/VanJyrQO9WVvC9eJg9zB9fLBfj/DIxOhTqkR2rwye0LL5YK8Xet4SYSWTUl7MlK8HBGUJc2h4OjUrM6ZoVIUf9KP0N3taJ6ttpEUruNiag7eb08kTsHcHHnmF87GYYzscuyndVCLCzQoitQ0Soe02MQc003C1u4zR/bB8pwvZRQjRMEOHQdDGOzhTixFt8TO9j49qsG2fEyv58rH5DToS4vvw+j6LGJrxPAWtrJc0xVoT3p4jJYiIcnyXAZwu0cFi88cV6C869o8KZpYHQeUu5fjFhany9yYizS4TYPNeC3DiKN0sFuLlHgbNr5Ng4leLKSjJOvRIX6tS4siMYGtri2cfaokQVGqYYLvI+ejf6w4q+GRDQPstwcWMuPq0y4VSVgeCHTxf4Eat6nHzbF8dn+uDQFAp6JNTk3q4PmbuqwnG8So+jc3UU3fX4eKEfTi82kCBGzB1k4drs/K2D1r8vPqw2wVv57DOYBy3zrLRb+OEYjXF0nh4n2JyLmGJGXH7XjOE9nbi1w4nL9fHYXFXAeQ7rJ5WIaFdogkvrQ3CtIRoV1O7GFieub44jb4nBtfoI3NiZQPElElc2JuDMxqbc/xaYsQd3DsHROfodvFPrS1LufVX7YOq4oRCSB/j5qWGzajiYzd6wEPtWgp2e7TYNXXkJVPZWu6wQEapHUpwFiXFmJMU+Q6LTjECrD9fG4a9FZLAOoYE+7h9L/JIAb5WU+pvceG6cGAuSnBaEBFmQHBdOiIDZqH9KAFMk0GZGsjMCKbGRCLAZEWAlWEw0twFBDFTHyjaTHhKxiNyfj9f7dcTNa2sfHFrVKp7G4fE+WJiU/v2F+fdmTh8NMcUBNvCvwU3ohmf9egTx4Klgz9Vxz/9kvH8FjCzPXB6w9c/V/2qs58f/R2AeXv5mGa6cXfJwQ21xDvV5lnZXpUTe+XL6tVVLZ0ImldBEvxTy2UAuIZ5/97QN9eHeUTvec1bu164xgm06NE2xIs1pRFEjK1rnRiE/1YKmqcEoSAtFekI4UsnCpcW56NKuCC0Ksp6N61GWG98jxzN42j2Fuz37Bun53RFTftSwMlz6dPG9VbNLMqnd36dNcxJMvzs78tymuirEOiMRFRGGmKhIKkchLsaJhFhCnBPxsdH0THXUJjY6gtqEwxkVxiGWyux9dHgoJ2xcVAgq+5egoiwPi0cXEnKwaWY+5lVkYvPMAlR0jcfwrsmYOaQFlkztj9JmGZg3rQL9y0o5wc1GHSLDAhEdFUzjh8AZHUoguaLZnOGIjgzjEMVA8kbRvFHhIdz8zggXYujd5PEDce3sgpvb5rWMcav7j9OWubGaW5+P3vHg1vpHP33X8ONP3zc8vP/9np9+vLP7wR9u77r/w42tj298Vf+3K+frcemz9bjw6Xp8+ck6XDhVh4un1uDCx6tx/vgqzJ8+nGNdTGd0hVQElYy2QLkESsqVMpZLuGetSg6dRkGRXQ6NQgQZnQvEdPxln8zYbwV6dS3B8b3L8OmR93DuBM310QZ88XE9LnyyAZdOb8TVc5uf3Ly05S/fX9vx8x9uNjz446199+/fef/+/e/3P3h494P7D+8eePjwh/2P7l5b8n7D8tb/+g+rwBzJlVjuAW8Cj8cvLAyWpKf7qtQSSaFYIPxZLpRAxhdCSgFGQpB6CVxlgRDr5zbBpCHpsNGFSEFBVk63Ng9kHCiac/CClC4+ajoiN08zY2L3EO4/TDLyAjkDkcnA+kgZsTS2SCCYQyKJCRSWnsr7d4mtBXfxP58EPEGBSCh8IBeJSFASkISV0RpkH0JZxC3MMuNsQzYuH2mLXgUOpJn4yDTzkWXhI8PihUZmL6TRczqhZaQS+xbk07aWiTdKrZyyShpHRWBfd1TsmbxCSnMJBF4raHqm+CuR4mkL/VpKO4iYhBQy5Z8LWAaNCHNG2nH9aAmm9XeidbQAraL5aBXFpzIfpbFCVLQy0C2uFfbMjkMKHXAEXq79WsiR6fEQGl8g/AttpeNpzv8/q/6bSUVHzGpau0/INbnTFslISrh+KCEi92/XRI3TW9Iwf3gssgIlyHIIkR0ixMhOdlK+AJN7BcGHDkqePh6wE6qQyCXFj9P4L+cHEf9qEvF4sUI+f59YSG5Ka/V5RZhHBJjpkjLJjiWjwpFglWFMWRD2VEWiSTzdLaiNi7RnYAcnwkUKiG1o+FfO6v80kcCFhM9ZJGeKUJWbBAqOZM3+bfxwalUc5g/xh5UC5K+t7lb8G0If6ku8/ncmcgJ+Gf355tfewKxt08u4n9Pxn7O6W/EfCOXU/+X+EvQ/mKS0LMrdiv2CCHr3VHHylodUnkx1aq7X/2DSkpKzCD97iHAr/hcqL6P3Flez//1kIaVrCN+S4ivpOcJV/aITj/d/AtCBMSY54ZcAAAAASUVORK5CYII=';
            assistModalContent.innerHTML = '<div class="assist-modal-header"><img src="' + iconStr + '" /><span style="padding-left: 15px;">SLY Lab Assistant v' + GM_info.script.version + '</span><div class="assist-modal-header-right"><button id="undockAllBtn" class="assist-modal-btn">Undock All</button><button id="configImportExport" class="assist-modal-btn">Import/Export</button><button class=" assist-modal-btn assist-modal-save">Save</button><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><table><tr><td>Fleet</td><td>Assignment</td><td>Target</td><td>Starbase</td><td>Subwarp</td><td>Max Cargo</td><td>Max Ammo</td><td>Max Fuel</td></tr></table></div>';
            assistModal.append(assistModalContent);

            let importModal = document.createElement('div');
            importModal.classList.add('assist-modal');
            importModal.id = 'importModal';
            importModal.style.display = 'none';
            importModal.style.zIndex = 3;
            let importModalContent = document.createElement('div');
            importModalContent.classList.add('assist-modal-content');
            importModalContent.innerHTML = '<div class="assist-modal-header"><span>Config Import/Export</span><div class="assist-modal-header-right"><button id="importTargetsBtn" class="assist-modal-btn assist-modal-save">Import Fleet Targets</button><button id="importConfigBtn" class="assist-modal-btn assist-modal-save">Import Config</button><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><div><ul><li>Copy the text below to save your raw Lab Assistant configuration.</li><li>To restore your previous configuration, enter configuration text in the text box below then click the Import Config button.</li><li>To import new Target coordinates for fleets, paste the exported text from EveEye in the text box below then click the Import Fleet Targets button.</li></ul></div><div></div><textarea id="importText" rows="4" cols="80" max-width="100%"></textarea></div>';
            importModal.append(importModalContent);

            let profileModal = document.createElement('div');
            profileModal.classList.add('assist-modal');
            profileModal.id = 'profileModal';
            profileModal.style.display = 'none';
            profileModal.style.zIndex = 3;
            let profileModalContent = document.createElement('div');
            profileModalContent.classList.add('assist-modal-content');
            profileModalContent.innerHTML = '<div class="assist-modal-header"><span>Profile Selection</span><div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><span>Select a profile to connect to Lab Assistant.</span><div></div><div id="profileDiv" max-width="100%"></div></div>';
            profileModal.append(profileModalContent);

            /*
            let addAcctModal = document.createElement('div');
            addAcctModal.classList.add('assist-modal');
            addAcctModal.id = 'addAcctModal';
            addAcctModal.style.display = 'none';
            addAcctModal.style.zIndex = 3;
            let addAcctModalContent = document.createElement('div');
            addAcctModalContent.classList.add('assist-modal-content');
            addAcctModalContent.innerHTML = '<div class="assist-modal-header"><span>Add Restricted Account</span><div class="assist-modal-header-right"><button id="addAcctBtn" class="assist-modal-btn">Add Account</button><button id="removeAcctBtn" class="assist-modal-btn">Remove Account</button><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><span>Grant restricted access to interact with this account\'s SAGE instance from another account. Enter the public key of the restricted account below.</span><div></div><div max-width="100%"><input id="addAcctDiv" type="text" style="width: 375px;"></div></div>';
            addAcctModal.append(addAcctModalContent);
            */

            let assistStatus = document.createElement('div');
            assistStatus.id = 'assistStatus';
            assistStatus.style.display = 'none';
            let assistStatusContent = document.createElement('div');
            assistStatusContent.classList.add('assist-status-content');
            assistStatusContent.innerHTML = '<div class="assist-modal-header" style="cursor: move;">Status<div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><table><tr><td>Fleet</td><td>Tools</td><td>SDUs</td><td>State</td></tr></table></div>'
            assistStatus.append(assistStatusContent);

            let assistCheck = document.createElement('div')
			assistCheck.id = 'assistCheck'
			assistCheck.style.display = 'none'
			let assistCheckContent = document.createElement('div')
			//assistCheckContent.classList.add('assist-check-content');
			assistCheckContent.innerHTML = '<div class="assist-modal-header" style="cursor: move;">Fleet Surveillance<div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div style="display: flex; flex-direction: row; justify-content: center;"><select id="fleetGridSelect"><option value="3">3x3</option><option value="5">5x5</option><option value="7">7x7</option></select><input id="checkFleetCntInput" type="text" placeholder="x, y" style="width: 50px;"><button id="checkFleetBtn" class="assist-btn"><span style="font-size: 14px;">Check</span></button></div><div style="display: flex; justify-content: center;"><div id="loadingMessage" style="display: none;">Loading...</div><table id="fleetGrid" class="fleet-grid" style="display: none;"></table></div></div>';
			assistCheck.append(assistCheckContent)

            let autoContainer = document.createElement('div');
            autoContainer.style.display = 'flex';
            autoContainer.style.flexDirection = 'row';
            let autoTitle = document.createElement('span');
            autoTitle.innerHTML = 'Lab Assistant';
            autoTitle.style.fontSize = '14px';
            let autoButton = document.createElement('button');
            autoButton.id = 'autoScanBtn';
            autoButton.classList.add('assist-btn');
            //autoButton.style.position = 'absolute';
            //autoButton.style.left = '50%';
            //autoButton.style.transform = 'translate(-50%, 0)';
            autoButton.addEventListener('click', function(e) {toggleAssistant();});
            let autoBtnSpan = document.createElement('span');
            autoBtnSpan.innerText = initComplete == true ? enableAssistant === true ? 'Stop' : 'Start' : 'Wait...';
            autoBtnSpan.style.fontSize = '14px';
            autoButton.appendChild(autoBtnSpan);

            let dropdown = document.createElement('div');
            dropdown.classList.add('dropdown');
            let dropdownBtn = document.createElement('button');
            dropdownBtn.classList.add('assist-btn');
            dropdownBtn.innerText = 'Tools';
            dropdownBtn.addEventListener('click', function () {
                dropdown.classList.toggle('show');
            })
            dropdown.addEventListener('click', function() {
                dropdown.classList.remove('show');
            });

            let assistConfigButton = document.createElement('button');
            assistConfigButton.id = 'assistConfigBtn';
            assistConfigButton.classList.add('assist-btn','assist-btn-alt');
            assistConfigButton.addEventListener('click', function(e) {assistModalToggle();});
            let assistConfigSpan = document.createElement('span');
            assistConfigSpan.innerText = 'Config';
            assistConfigSpan.style.fontSize = '14px';
            assistConfigButton.appendChild(assistConfigSpan);

            let assistCheckButton = document.createElement('button');
            assistCheckButton.id = 'assistCheckBtn';
            assistCheckButton.classList.add('assist-btn','assist-btn-alt');
            assistCheckButton.addEventListener('click', function(e) {assistCheckToggle();});
            let assistCheckSpan = document.createElement('span');
            assistCheckSpan.innerText = 'Surveillance';
            assistCheckSpan.style.fontSize = '14px';
            assistCheckButton.appendChild(assistCheckSpan);

            let assistStatusButton = document.createElement('button');
            assistStatusButton.id = 'assistStatusBtn';
            assistStatusButton.classList.add('assist-btn','assist-btn-alt');
            assistStatusButton.addEventListener('click', function(e) {assistStatusToggle();});
            let assistStatusSpan = document.createElement('span');
            assistStatusSpan.innerText = 'Status';
            assistStatusSpan.style.fontSize = '14px';
            assistStatusButton.appendChild(assistStatusSpan);
            autoContainer.appendChild(autoTitle);
            autoContainer.appendChild(autoButton);
            autoContainer.appendChild(dropdownBtn);
			autoContainer.appendChild(dropdown);

            dropdown.appendChild(assistStatusButton);
            dropdown.appendChild(assistCheckButton);
            dropdown.appendChild(assistConfigButton);

            let targetElem = document.querySelector('body');
            if (observer) {
                autoContainer.id = 'assistContainer';
                targetElem = document.querySelector('#root > div:first-of-type > div:first-of-type > div > header > h1');
                targetElem.style.fontSize = '18px';
                targetElem.append(assistCSS);
                let accountManagerContainer = document.getElementById("accountManagerContainer");
                let accountManagerBtn = document.getElementById("accountManagerBtn");
                if (accountManagerContainer && accountManagerBtn) {
                    autoContainer = accountManagerContainer;
                    accountManagerContainer.insertBefore(autoButton, accountManagerBtn);
                    accountManagerContainer.insertBefore(dropdownBtn, accountManagerBtn);
                    accountManagerContainer.insertBefore(dropdown, accountManagerBtn);
                } else {
                    targetElem.append(autoContainer);
                }
            } else {
                autoContainer.id = 'assistContainerIso';
                let accountManagerContainer = document.getElementById("accountManagerContainerIso");
                let accountManagerBtn = document.getElementById("accountManagerBtn");
                if (accountManagerContainer && accountManagerBtn) {
                    autoContainer = accountManagerContainer;
                    accountManagerContainer.insertBefore(autoButton, accountManagerBtn);
                    accountManagerContainer.insertBefore(dropdownBtn, accountManagerBtn);
                    accountManagerContainer.insertBefore(dropdown, accountManagerBtn);
                } else {
                    targetElem.prepend(autoContainer);
                }
                targetElem.prepend(assistCSS);
            }
            // these were originally attached to targetElem
            autoContainer.append(assistModal);
            autoContainer.append(assistStatus);
            autoContainer.append(assistCheck);
            autoContainer.append(importModal);
            autoContainer.append(profileModal);
            //autoContainer.append(addAcctModal);
            let assistModalClose = document.querySelector('#assistModal .assist-modal-close');
            assistModalClose.addEventListener('click', function(e) {assistModalToggle();});
            let assistModalSave = document.querySelector('#assistModal .assist-modal-save');
            assistModalSave.addEventListener('click', function(e) {saveAssistInput();});
            let assistStatusClose = document.querySelector('#assistStatus .assist-modal-close');
            assistStatusClose.addEventListener('click', function(e) {assistStatusToggle();});
            let assistCheckClose = document.querySelector('#assistCheck .assist-modal-close');
            assistCheckClose.addEventListener('click', function(e) {assistCheckToggle();});
            let assistCheckFleetBtn = document.querySelector('#checkFleetBtn');
            assistCheckFleetBtn.addEventListener('click', function(e) {getFleetCntAtCoords();});
            let configImportExport = document.querySelector('#configImportExport');
            configImportExport.addEventListener('click', function(e) {assistImportToggle();});
            let configImport = document.querySelector('#importConfigBtn');
            configImport.addEventListener('click', function(e) {saveConfigImport();});
            let targetsImport = document.querySelector('#importTargetsBtn');
            targetsImport.addEventListener('click', function(e) {saveTargetsImport();});
            let undockAllBtn = document.querySelector('#undockAllBtn');
            undockAllBtn.addEventListener('click', function(e) {handleUndockAll();});
            //let addAcctBtn = document.querySelector('#addAcctBtn');
            //addAcctBtn.addEventListener('click', function(e) {addKeyToProfile(document.querySelector('#addAcctDiv').value);});
            //let removeAcctBtn = document.querySelector('#removeAcctBtn');
            //removeAcctBtn.addEventListener('click', function(e) {removeKeyFromProfile();});
            let configImportClose = document.querySelector('#importModal .assist-modal-close');
            configImportClose.addEventListener('click', function(e) {assistImportToggle();});
            let profileModalClose = document.querySelector('#profileModal .assist-modal-close');
            profileModalClose.addEventListener('click', function(e) {assistProfileToggle(null);});
            //let addAcctClose = document.querySelector('#addAcctModal .assist-modal-close');
            //addAcctClose.addEventListener('click', function(e) {assistAddAcctToggle();});

            makeDraggable(assistCheck);
            makeDraggable(assistStatus);
        }
    }
    observer.observe(document, {childList: true, subtree: true});
    waitForLabs(null, null);

    await initUser();
    let autoSpanRef = document.querySelector('#autoScanBtn > span');
    autoSpanRef ? autoSpanRef.innerHTML = 'Start' : null;
    console.log('init complete');
    console.log('Fleets: ', userFleets);

    // DEBUG - use if mining fleet gets stuck
    /*
    async function miningSelfDestruct(fleet, destX, destY) {
        let [playerAtlasTokenAcct] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                new solanaWeb3.PublicKey(userPublicKey).toBuffer(),
                new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                new solanaWeb3.PublicKey('ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx').toBuffer()
            ],
            new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
        );
        let [mineItem] = await sageProgram.account.mineItem.all([
            {
                memcmp: {
                    offset: 105,
                    bytes: fleet.mineResource,
                },
            },
        ]);
        let planets = await getPlanetsFromCoords(destX, destY);
        let sageResource = null;
        let planet = null;
        for (let planetCheck of planets) {
            let resourceCheck = await sageProgram.account.resource.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: planetCheck.publicKey,
                    },
                },
                {
                    memcmp: {
                        offset: 73,
                        bytes: mineItem.publicKey,
                    },
                },
            ]);
            if (sageResource === null && resourceCheck.length > 0) {
                [sageResource] = resourceCheck;
                planet = planetCheck
            }
        }
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.mineAsteroidToRespawn({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                resource: sageResource.publicKey,
                planet: planet.publicKey,
                fuelTank: fleet.fuelTank,
                fuelTokenFrom: fleet.fuelToken,
                atlasTokenFrom: playerAtlasTokenAcct,
                atlasTokenTo: 'FdHkzP8eWeFpNSreMiZCWzJYrcZG2GJAPSyb3gENL8fS',
                tokenProgram: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            }).instruction()}
            let txResult = await txSignAndSend(tx);
            console.log(txResult);
            resolve(txResult);
        });
    }
    await miningSelfDestruct(userFleets[2], -30, 30);
    */

})();
