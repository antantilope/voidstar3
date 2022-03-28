
MAX_SERVER_FPS = 30
MIN_ELAPSED_TIME_PER_FRAME = 1 / MAX_SERVER_FPS

GAME_START_COUNTDOWN_FROM = 6

ORGIN_COORD = (0, 0,)

FINAL_EXPLOSION_FRAME = 150

# Ship Defaults

SHIP_X_LEN = 4
SHIP_Y_LEN = 12

FUEL_MASS_UNITS_PER_KG = 75

BATTERY_STARTING_POWER = 250_000
BATTERY_POWER_CAPACITY = 1_000_000
BATTERY_MASS = 5

FUEL_START_LEVEL = 18_000
FUEL_CAPACITY = 25_000

MAX_VISUAL_RANGE_M = 800

ENGINE_MASS = 105
ENGINE_BASE_FORCE_N = 3500
SECONDS_TO_START_ENGINE = 3
ACTIVATE_ENGINE_POWER_REQUIREMENT_TOTAL = 5000
ACTIVATE_ENGINE_POWER_REQUIREMENT_PER_SECOND =  round(
    ACTIVATE_ENGINE_POWER_REQUIREMENT_TOTAL
    / SECONDS_TO_START_ENGINE
)
ENGINE_IDLE_POWER_REQUIREMENT_PER_SECOND = 250
ENGINE_FUEL_USAGE_PER_SECOND = 75
ENGINE_BATTERY_CHARGE_PER_SECOND = round(ENGINE_IDLE_POWER_REQUIREMENT_PER_SECOND * 4)
ENGINE_LIT_THERMAL_SIGNATURE_RATE_PER_SECOND = 325
ENGINE_BOOST_MULTIPLE = 75

APU_SECONDS_TO_START = 5
ACTIVATE_APU_POWER_REQUIREMENT_TOTAL = 500
ACTIVATE_APU_POWER_REQUIREMENT_PER_SECOND = round(
    ACTIVATE_APU_POWER_REQUIREMENT_TOTAL
    / APU_SECONDS_TO_START
)
APU_ONLINE_THERMAL_SIGNATURE_RATE_PER_SECOND = 75
APU_BATTERY_CHARGE_PER_SECOND = 200
ENGINE_FUEL_USAGE_PER_SECOND = 45

SCANNER_SECONDS_TO_START = 1
ACTIVATE_SCANNER_POWER_REQUIREMENT_TOTAL = 1000
ACTIVATE_SCANNER_POWER_REQUIREMENT_PER_SECOND = round(
    ACTIVATE_SCANNER_POWER_REQUIREMENT_TOTAL
    / SCANNER_SECONDS_TO_START
)
SCANNER_POWER_REQUIREMENT_PER_SECOND = 100
SCANNER_MODE_RADAR_RANGE_M = 3000
SCANNER_MODE_IR_RANGE_M = 5000
SCANNER_IR_MINIMUM_THERMAL_SIGNATURE = 500
SCANNER_GET_LOCK_CHANNEL_SECONDS = 6
SCANNER_GET_LOCK_POWER_REQUIREMENT_TOTAL = 1000
SCANNER_GET_LOCK_POWER_REQUIREMENT_PER_SECOND = SCANNER_GET_LOCK_POWER_REQUIREMENT_TOTAL / SCANNER_GET_LOCK_CHANNEL_SECONDS
SCANNER_LOCKING_MAX_TRAVERSAL_DEGREES = 1.2
SCANNER_LOCKED_MAX_TRAVERSAL_DEGREES = 1.8

THERMAL_DISSIPATION_PER_SECOND = 50

EBEAM_CHARGE_BATTERY_POWER_DRAW_MULTIPLE = 4
EBEAM_CHARGE_RATE_PER_SECOND = 600
EBEAM_CHARGE_THERMAL_SIGNATURE_RATE_PER_SECOND = 250
EBEAM_CHARGE_CAPACITY = 10000
EBEAM_DISCHARGE_RATE_PER_SECOND = 35000
EBEAM_CHARGE_FIRE_MINIMUM = 4000
EBEAM_COLOR_STARTING = "#ff0000"

GRAVITY_BRAKE_TRAVERSAL_PER_SECOND = 25

ORE_CAPACITY_KG = 80
MINING_ORE_POWER_USAGE_PER_SECOND = 250
MINING_ORE_KG_COLLECTED_PER_SECOND = 8

# Mass in kilograms
PILOT_MASS = 75
HULL_BASE_MASS = 300

DEGREES_NORTH = 0
DEGREES_EAST = 90
DEGREES_SOUTH = 180
DEGREES_WEST = 270
DEGREES_NORTH_EAST = DEGREES_NORTH + 45
DEGREES_SOUTH_EAST = DEGREES_EAST + 45
DEGREES_SOUTH_WEST = DEGREES_SOUTH + 45
DEGREES_NORTH_WEST = DEGREES_WEST + 45

class GENERAL_DIRECTION:
    north_east_ish = "ne-ish"
    south_east_ish = "se-ish"
    south_west_ish = "sw-ish"
    north_west_ish = "nw-ish"

PIXEL_BLACK = 0
PIXEL_WHITE = 255


# For use with computer vision & Numpy.
# These are NOT HTML colors.
class CV2Color:
    black = (PIXEL_BLACK, PIXEL_BLACK, PIXEL_BLACK,)
    white = (PIXEL_WHITE, PIXEL_WHITE, PIXEL_WHITE,)
    gray = (100, 100, 100,)
    dark_red = (0, 0, 200,)
    red = (0, 0, 255,)
    green = (0, 255, 0,)
    dark_green = (0, 190, 0,)
    blue = (255, 0, 0,)
    dark_blue = (190, 0, 0,)
    purple = (255, 0, 170,)
    orange = (0, 127, 255,)
    yellow = (0, 204, 255,)

