
MAX_SERVER_FPS = 30
MIN_ELAPSED_TIME_PER_FRAME = 1 / MAX_SERVER_FPS

ORGIN_COORD = (0, 0,)

# Ship Defaults

SHIP_X_LEN = 4
SHIP_Y_LEN = 12

FUEL_MASS_UNITS_PER_KG = 75

BATTERY_STARTING_POWER = 250_000
BATTERY_POWER_CAPACITY = 1_000_000
BATTERY_MASS = 5

FUEL_START_LEVEL = 7_500
FUEL_CAPACITY = 10_000

ENGINE_MASS = 105
ENGINE_BASE_FORCE_N = 1100
SECONDS_TO_START_ENGINE = 10
ACTIVATE_ENGINE_POWER_REQUIREMENT_TOTAL = 25000
ACTIVATE_ENGINE_POWER_REQUIREMENT_PER_SECOND =  round(
    ACTIVATE_ENGINE_POWER_REQUIREMENT_TOTAL
    / SECONDS_TO_START_ENGINE
)
ENGINE_IDLE_POWER_REQUIREMENT_PER_SECOND = 400
ENGINE_FUEL_USAGE_PER_SECOND = 50
ENGINE_BATTERY_CHARGE_PER_SECOND = round(ACTIVATE_ENGINE_POWER_REQUIREMENT_PER_SECOND * 1.2)

SCANNER_SECONDS_TO_START = 6
ACTIVATE_SCANNER_POWER_REQUIREMENT_TOTAL = 7000
ACTIVATE_SCANNER_POWER_REQUIREMENT_PER_SECOND = round(
    ACTIVATE_SCANNER_POWER_REQUIREMENT_TOTAL
    / SCANNER_SECONDS_TO_START
)
SCANNER_POWER_REQUIREMENT_PER_FRAME = 5
SCANNER_POWER_REQUIREMENT_PER_SECOND = 100
SCANNER_MODE_RADAR_RANGE_M = 2000
SCANNER_MODE_IR_RANGE_M = 10000
SCANNER_IR_MINIMUM_THERMAL_SIGNATURE = 50

ACTIVATE_REACTION_WHEEL_POWER_REQUIREMENT = 500
REACTION_WHEEL_POWER_REQUIREMENT_PER_SECOND = 25

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

