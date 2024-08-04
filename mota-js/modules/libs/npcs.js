export default class Npcs {
	constructor() {
		this.npcs = {
			'npc1': { 'id': 'npc1', 'name': '神秘老人', 'icon': 'magician' },
			'npc2': { 'id': 'npc2', 'name': '神秘老人', 'icon': 'magician' },
			'npc3': { 'id': 'npc3', 'name': '神秘老人', 'icon': 'womanMagician' },
			'npc4': { 'id': 'npc4', 'name': '神秘老人', 'icon': 'womanMagician' },
		}
	}
	getNpcs(npcId) {
		if (npcId == undefined) {
			return this.npcs;
		}
		return this.npcs[npcId];
	}
	getEffect(npcid, times) {
		switch (npcid) {
			case 'npc1':
				return [
					{
						'action': 'text', 'id': 'npc1',
						'content': '提示：灰色的水泥墙比棕色的更为坚固。\n用破墙镐无法破坏水泥墙。\n例如本层墙内的宝物，可以使用地震卷轴获取。'
					},
				];
				break;
			case 'npc2':
				return [
					{
						'action': 'text', 'id': 'npc2',
						'content': '提示：14F位于神秘空间之中，无法直接到达。\n只能使用特殊道具到达。\n类似14F的还有一层，在0F。'
					}
				];
				break;
			case 'npc3':
				return [
					{
						'action': 'choices', 'id': 'npc3', 'cancel': true, 'hint': '送你一件道具，你自己\n选吧：',
						'choices': [
							{ "text": '破墙镐', 'effect': 'item,pickaxe,1' },
							{ "text": '炸弹', 'effect': 'item,bomb,1' },
							{ "text": '中心对称飞行器', 'effect': 'item,centerFly,1' }
						]
					},
					{
						'action': 'text', 'id': 'npc3',
						'content': '祝你好运，我先溜了~'
					},
					{ 'action': 'disappear' }
				];
				break;
			case 'npc4':
				return [
					{
						'action': 'choices', 'id': 'npc4', 'cancel': true, 'hint': '低价回收各种钥匙：',
						'choices': [
							{ "text": '黄钥匙（7金币）', 'effect': 'status,money,7', 'need': 'item,yellowKey,1' },
							{ "text": '蓝钥匙（35金币）', 'effect': 'status,money,35', 'need': 'item,blueKey,1' },
							{ "text": '红钥匙（70金币）', 'effect': 'status,money,70', 'need': 'item,redKey,1' }
						]
					},
					{ 'action': 'revisit' }
				];
				break;
		}
		return [];
	}
}