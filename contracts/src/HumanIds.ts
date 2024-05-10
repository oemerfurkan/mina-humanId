import {
  state,
  method,
  State,
  Field,
  MerkleWitness,
  SmartContract,
} from 'o1js';

class MerkleWitness128 extends MerkleWitness(128) {}

export class HumanIds extends SmartContract {
  @state(Field) treeRoot = State<Field>();

  @method async initRoot(root: Field) {
    this.treeRoot.set(root);
  }

  @method async addHumanId(
    humanId: Field,
    leafWitness: MerkleWitness128,
  ) {
    const currentTreeRoot = this.treeRoot.get();
    this.treeRoot.requireEquals(currentTreeRoot);

    humanId.assertGreaterThan(0n);

    const rootBefore = leafWitness.calculateRoot(Field(0));
    rootBefore.assertEquals(currentTreeRoot);

    const rootAfter = leafWitness.calculateRoot(humanId);

    this.treeRoot.set(rootAfter);
  }
}
