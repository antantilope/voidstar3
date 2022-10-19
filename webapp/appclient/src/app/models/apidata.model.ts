
/* Data models returned from the server
*/

export class MapConfig {
    units_per_meter: number
    map_name: string
    x_unit_length: number
    y_unit_length: number
}

export class EbeamRay {
    start_point: number[]
    end_point: number[]
    color: string
}

export class ExplosionShockWave {
    id: string
    origin_point: number[]
    radius_meters: number
}

export class Explosion {
    id: string
    origin_point: number[]
    radius_meters: number
    max_radius_meters: number
    flame_ms: number
    fade_ms: number
    elapsed_ms: number
}

export class KillFeedElement {
    created_at_frame: number
    victim_name: string
}

export class SpaceStation {
    uuid: string
    name: string
    position_meters_x: number
    position_meters_y: number
    service_radius_meters: number
    position_map_units_x: number
    position_map_units_y: number
    service_radius_map_units: number
    collision_radius_meters: number
}

export class OreMine {
    uuid: string
    name: string
    position_meters_x: number
    position_meters_y: number
    service_radius_meters: number
    position_map_units_x: number
    position_map_units_y: number
    service_radius_map_units: number
    collision_radius_meters: number
    starting_ore_amount_kg: number
}

// Upgrades // // //
export class UpgradeCost {
    ore: number
    number: number
    seconds: number
    core_upgrade_slugs?: string[]
}

export class UpgradePathSummary {
    name: string
    slug: string
    seconds_researched: number | null
    current_level: number
    max_level: number
    current_cost: UpgradeCost | null
}
type ShipUpgradeMap = {
    scanner_range: UpgradePathSummary
    radar_sensitivity: UpgradePathSummary
    anti_radar_coating: UpgradePathSummary
    scanner_lock_traversal: UpgradePathSummary
    engine_newtons: UpgradePathSummary
    ore_capacity: UpgradePathSummary
    battery_capacity: UpgradePathSummary
    fuel_capacity: UpgradePathSummary
    apu_efficiency: UpgradePathSummary
}
type CoreUpgradeMap = {
    titanium_alloy_hull: UpgradePathSummary
    advanced_electronics: UpgradePathSummary
    liquid_nitrogen_cooling: UpgradePathSummary
}
export class UpgradeSummary {
    ship: ShipUpgradeMap
    core: CoreUpgradeMap
}

export class ScannerDataShipElement {
    element_type: string
    coord_x: number
    coord_y: number
    id: string
    alive: boolean
    velocity_x_meters_per_second: number
    velocity_y_meters_per_second: number
    anti_radar_coating_level: number
    designator: string
    visual_shape: string
    in_visual_range: boolean
    visual_p0: number[]
    visual_p1: number[]
    visual_p2: number[]
    visual_p3: number[]
    visual_fin_0_rel_rot_coord_0: number[]
    visual_fin_0_rel_rot_coord_1: number[]
    visual_fin_1_rel_rot_coord_0: number[]
    visual_fin_1_rel_rot_coord_1: number[]
    visual_engine_lit: boolean
    visual_engine_boosted_last_frame: number
    visual_fill_color: string
    visual_ebeam_color: string
    visual_ebeam_firing: boolean
    aflame: boolean
    exploded: boolean
    distance: number
    relative_heading: number
    target_heading: number
    scanner_thermal_signature: number
    visual_gravity_brake_position: number
    visual_gravity_brake_deployed_position: number
    visual_gravity_brake_active: boolean
    visual_mining_ore_location: string | null
    visual_fueling_at_station: boolean
    visual_ebeam_charging: boolean
}
export class ScannerDataMagnetMineElement {
    id: string
    velocity_x_meters_per_second: number
    velocity_y_meters_per_second: number
    coord_x: number
    coord_y: number
    target_heading: number
    distance: number
    exploded: boolean
}

type scoutedOre = {
    [key: string]: number
}
class Timer {
    name: string
    percent: number // 0 through 100. Divide by 100 to get decimal.
    slug?: string
}
export class Ship {
    id: string
    team_id: string
    mass: number
    coord_x: number
    coord_y: number
    heading: number

    rel_rot_coord_0: number[]
    rel_rot_coord_1: number[]
    rel_rot_coord_2: number[]
    rel_rot_coord_3: number[]
    fin_0_rel_rot_coord_0:  number[]
    fin_0_rel_rot_coord_1:  number[]
    fin_1_rel_rot_coord_0:  number[]
    fin_1_rel_rot_coord_1:  number[]

    velocity_x_meters_per_second: number
    velocity_y_meters_per_second: number

    battery_power: number
    battery_capacity: number
    fuel_level: number
    fuel_capacity: number
    fueling_at_station: boolean
    fuel_cost_ore_kg_per_fuel_unit: number

    upgrade_summary: UpgradeSummary

    engine_newtons: number
    engine_online: boolean
    engine_lit: boolean
    engine_starting: boolean
    engine_boosted: boolean
    engine_boosted_last_frame: number
    engine_lit_thermal_signature_rate_per_second: number

    apu_starting: boolean
    apu_online: boolean
    apu_battery_charge_per_second: number
    apu_fuel_usage_per_second: number
    apu_online_thermal_signature_rate_per_second: number

    scanner_online: boolean
    scanner_locking: boolean
    scanner_locked: boolean
    scanner_lock_target: string | null
    scanner_starting: boolean
    scanner_mode: string
    scanner_radar_range: number
    scanner_ir_range: number
    scanner_ir_minimum_thermal_signature: number
    scanner_thermal_signature: number
    scanner_lock_traversal_slack: number
    scanner_locking_max_traversal_degrees: number
    scanner_locked_max_traversal_degrees: number
    scanner_radar_sensitivity: number
    scanner_ship_data: ScannerDataShipElement[]
    scanner_magnet_mine_data: ScannerDataMagnetMineElement[]

    anti_radar_coating_level: number

    ebeam_firing: boolean
    ebeam_charging: boolean
    ebeam_charge_capacity: number
    ebeam_color: string
    ebeam_charge: number
    ebeam_can_fire: boolean
    ebeam_last_hit_frame: number
    ebeam_charge_rate_per_second: number
    ebeam_charge_power_usage_per_second: number
    ebeam_charge_thermal_signature_rate_per_second: number
    ebeam_charge_fire_minimum: number

    special_weapons_tubes_count: number
    special_weapons_loaded: number
    magnet_mines_loaded: number

    docked_at_station: string
    gravity_brake_position: number
    gravity_brake_deployed_position: number
    gravity_brake_retracting: boolean
    gravity_brake_extending: boolean
    gravity_brake_active: boolean
    gravity_brake_deployed: boolean
    scouted_station_gravity_brake_catches_last_frame: {[key: string]: number}

    parked_at_ore_mine: string
    mining_ore: boolean
    cargo_ore_mass_kg: number
    cargo_ore_mass_capacity_kg: number
    virtual_ore_kg: number
    scouted_mine_ore_remaining: scoutedOre
    last_ore_deposit_frame: number

    alive: boolean
    died_on_frame: number | null
    aflame: boolean
    exploded: boolean

    visual_range: number

    autopilot_program: string | null

    timers: Timer[]
}

export class FrameData {
    phase: string

    elapsed_time: string
    game_frame: number
    server_fps: number
    server_fps_throttle_seconds: number
    winning_team: string

    map_config: MapConfig
    ebeam_rays: EbeamRay[]
    space_stations: SpaceStation[]
    ore_mines: OreMine[]
    explosion_shockwaves: ExplosionShockWave[]
    explosions: Explosion[]
    killfeed: KillFeedElement[]
    ship: Ship
}
