import {
  MerkleTree,
  MerkleWitness,
  PrivateKey,
  Mina,
  AccountUpdate,
  PublicKey,
  Account,
  Field,
} from 'o1js';
import { HumanIds } from './HumanIds';

class MerkleWitness128 extends MerkleWitness(128) {}

describe('HumanIds', () => {
  it('Deneme', async () => {
    const height = 128;
    const tree = new MerkleTree(height);

    const appPrivKey = PrivateKey.random();
    const appPublicKey = appPrivKey.toPublicKey();
    const humanIds = new HumanIds(appPublicKey);
    await HumanIds.compile();

    const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    const deployerPrivKey = PrivateKey.random();
    const deployer = deployerPrivKey.toPublicKey();

    Local.addAccount(deployer, '1000000000');

    const deployTxn = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await humanIds.deploy();
      await humanIds.initRoot(tree.getRoot());
    });

    await deployTxn.prove();
    deployTxn.sign([deployerPrivKey, appPrivKey]);

    const pendingDeployTx = await deployTxn.send();

    await pendingDeployTx.wait();

    console.log('Deployed HumanIds contract at', humanIds.address);

    const exampleHumanId = Field(32);
    const exampleHumanIdIndex = 4532n;
    const leafWitness = new MerkleWitness128(
      tree.getWitness(exampleHumanIdIndex)
    );

    tree.setLeaf(exampleHumanIdIndex, exampleHumanId);

    const txn1 = await Mina.transaction(deployer, async () => {
      await humanIds.addHumanId(exampleHumanId, leafWitness);
    });

    await txn1.prove();
    const pendingTx = await txn1
      .sign([deployerPrivKey, appPrivKey])
      .send();
    await pendingTx.wait();

    console.log(
        `BasicMerkleTree: local tree root hash after send1: ${tree.getRoot()}`
      );
      console.log(
        `BasicMerkleTree: smart contract root hash after send1: ${humanIds.treeRoot.get()}`
      );
  });
});
