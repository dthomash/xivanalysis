import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Events, Event} from 'event'
import {dependency} from 'parser/core/Injectable'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {Analyser} from '../../Analyser'
import {filter, oneOf} from '../../filter'
import {Data} from '../Data'

interface HealActionRule {
	name: string
	description: string
	triggerActions: number[]
	evaluate(healActionSnapshot: HealActionSnapshot): HealActionSuggestion | undefined
}

export interface HealActionEvaluator {
	evaluate(healActionSnapshot: HealActionSnapshot): HealActionSuggestion | undefined
}

export interface HealActionSuggestion {
	healAction: number | undefined
	timestamp: number
	issue: string
	suggestion: JSX.Element
}

export interface HealActionSnapshot {
	action: Action | undefined
	timestamp: number
	availableHealActions: number[]
}

export abstract class InefficientHealing extends Analyser {
	static override handle = 'inefficienthealing'

	@dependency protected data!: Data

	abstract healActions: number[]
	abstract healActionRules: HealActionRule[]
	private healActionUses: Map<number, number[]> = new Map<number, number[]>()
	private healActionSuggestions: HealActionSuggestion[] = []

	override initialise() {
		this.healActions.forEach(healActionId => this.healActionUses.set(healActionId, []))
		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(oneOf(this.healActions)),
			this.onHealActionUsed)

		this.addEventHook('complete', this.onComplete)
	}

	override output() {
		return <Table>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell>Heal Action</Table.HeaderCell>
					<Table.HeaderCell>Issue</Table.HeaderCell>
					<Table.HeaderCell>Suggestion</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					this.healActionSuggestions.map(healActionSuggestion => <Table.Row key={healActionSuggestion.timestamp}>
						<Table.Cell>
							<ActionLink {...this.data.getAction(healActionSuggestion.healAction ?? 0)}></ActionLink>
							<Button
								circular
								compact
								size="mini"
								icon="time"
							/>{this.parser.formatEpochTimestamp(healActionSuggestion.timestamp)}
						</Table.Cell>
						<Table.Cell>{healActionSuggestion.issue}</Table.Cell>
						<Table.Cell>{healActionSuggestion.suggestion}</Table.Cell>
					</Table.Row>)
				}
			</Table.Body>
		</Table>
	}

	private onComplete() {
		this.healActionRules.forEach(healActionRule => {
			healActionRule.triggerActions.forEach(trackedHealAction => {
				this.healActionUses.get(trackedHealAction)?.forEach(timestamp => {
					const healActionSuggestion = healActionRule.evaluate({
						action: this.data.getAction(trackedHealAction),
						timestamp: timestamp,
						availableHealActions: this.healActions.filter(healAction => this.isHealActionAvailable(healAction, timestamp)),
					})
					if (healActionSuggestion) {
						this.healActionSuggestions.push(healActionSuggestion)
					}
				})
			})
		})
	}

	private onHealActionUsed(event: Events['action']) {
		this.healActionUses.get(event.action)?.push(event.timestamp)
	}

	private isHealActionAvailable(healAction: number, timestamp: number) {
		const healActionCooldown = this.data.getAction(healAction)?.cooldown ?? 0
		return !this.healActionUses.get(healAction)?.some(healActionTimestamp => Math.abs(healActionTimestamp - timestamp) < healActionCooldown)
	}
}
