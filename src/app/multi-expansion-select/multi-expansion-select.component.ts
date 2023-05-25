import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';

export interface LayerManagerInfo {
  managerId: number;
  managerName: string;
  managerEmail: string;
  orgId: string;
  orgName: string;
}

/**
 * Node for item
 */
export class ItemNode {
  constructor(public item: string, public children: ItemNode[], public data?: LayerManagerInfo) {}
}

/**
 * Flat item node with expandable and level information
 */
export class ItemFlatNode {
  constructor(
    public item: string,
    public level: number,
    public expandable: boolean,
    public data?: LayerManagerInfo
  ) {}
}

function buildTree(): ItemNode[] {
  let listNode: ItemNode[] = [];

  for (let i = 0; i < 6; ++i) {
    const layer: ItemNode = {
      item: `Layer ${i}`,
      children: []
    };

    for (let j = 0; j < 2000; ++j) {
      const manager: ItemNode = {
        item: `Manager ${j}`,
        children: [],
        data: {
          managerId: j,
          managerName: `Manager ${j}`,
          managerEmail: `manager${j}@gmail.com`,
          orgId: `OrgId ${j}`,
          orgName: `OrgName ${j}`,
        },
      };

      layer.children.push(manager);
    }

    listNode.push(layer);
  }

  return listNode;
}

@Component({
  selector: 'app-multi-expansion-select',
  templateUrl: './multi-expansion-select.component.html',
  styleUrls: ['./multi-expansion-select.component.css']
})
export class MultiExpansionSelectComponent {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<ItemFlatNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<ItemNode, ItemFlatNode>();

  treeControl: FlatTreeControl<ItemFlatNode>;

  treeFlattener: MatTreeFlattener<ItemNode, ItemFlatNode>;

  dataSource: MatTreeFlatDataSource<ItemNode, ItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<ItemFlatNode>(true /* multiple */);

  getLevel = (node: ItemFlatNode) => node.level;

  isExpandable = (node: ItemFlatNode) => node.expandable;

  getChildren = (node: ItemNode): ItemNode[] => node.children;

  hasChild = (_: number, _nodeData: ItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: ItemFlatNode) => _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: ItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new ItemFlatNode('', 0, false);
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    flatNode.data = node.data;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  constructor() {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<ItemFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );
    this.dataSource.data = buildTree();
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: ItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return (
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      })
    );
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: ItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: ItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach((child) => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
    console.log(this.checklistSelection.selected);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: ItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
    console.log(this.checklistSelection.selected);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: ItemFlatNode): void {
    let parent: ItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: ItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: ItemFlatNode): ItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
}
