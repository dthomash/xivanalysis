import {ActionLink} from 'components/ui/DbLink'
import {HealActionSnapshot, InefficientHealing as CoreInefficientHealing} from 'parser/core/modules/InefficientHealing/InefficientHealing'
import React from 'react'

export class InefficientHealing extends CoreInefficientHealing {
	gcdHealActions = [
		this.data.actions.SCH_PHYSICK.id,
		this.data.actions.ADLOQUIUM.id,
		this.data.actions.SUCCOR.id,
	]
	succorAlternateActions = [
		this.data.actions.SCH_WHISPERING_DAWN,
		this.data.actions.SCH_FEY_BLESSING,
		this.data.actions.SUMMON_SERAPH,
		this.data.actions.INDOMITABILITY,
	]
	healActions = [
		...this.gcdHealActions,
		...this.succorAlternateActions.map(action => action.id),
		this.data.actions.RECITATION.id,
		this.data.actions.LUSTRATE.id,
		this.data.actions.SACRED_SOIL.id,
		this.data.actions.EXCOGITATION.id,
		this.data.actions.SCH_AETHERPACT.id,
		this.data.actions.EMERGENCY_TACTICS.id,
		this.data.actions.DEPLOYMENT_TACTICS.id,
	]
	override healActionRules = [
		{
			name: 'GCD Healing',
			description: 'Using GCD heals reduces your damage output and should be avoided.',
			triggerActions: [this.data.actions.SUCCOR.id],
			evaluate: (healActionSnapshot: HealActionSnapshot) => {
				let availableOgcds = this.succorAlternateActions.filter(action => healActionSnapshot.availableHealActions.includes(action.id))
				if (!healActionSnapshot.availableHealActions.includes(this.data.actions.RECITATION.id) || !availableOgcds.some(action => action.id === this.data.actions.INDOMITABILITY.id)) {
					availableOgcds = availableOgcds.filter(action => action.id !== this.data.actions.INDOMITABILITY.id)
				}
				if (availableOgcds.length > 0) {
					return {
						healAction: healActionSnapshot?.action?.id,
						timestamp: healActionSnapshot.timestamp,
						issue: 'Inefficient GCD Heal',
						suggestion: <>The following oGCD options were available and should've been used instead: {availableOgcds.map(availableOgcd => <ActionLink key={availableOgcd.id} {...availableOgcd}></ActionLink>)}</>,
					}
				}

				return undefined
			},
		},
	]
}
