import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import {
  Camera,
  VelocityTrailElement,
  FlameSmokeElement,
  EMPTrailElement,
  VELOCITY_TRAIL_ELEMENT_TTL_MS,
  FLAME_SMOKE_ELEMENT_TTL_MS,
  EMP_TRAIL_ELEMENT_TTL_MS,
} from './camera.service';
import { FormattingService } from './formatting.service';
import { QuoteService, QuoteDetails } from './quote.service';
import { UserService } from "./user.service";
import {
  BoxCoords
} from "./models/box-coords.model"
import {
  DrawableShip,
  DrawableMagnetMine,
  DrawableMagnetMineTargetingLine,
  DrawableEMP,
  VisionCircle,
  EBeamRayDetails,
} from "./models/drawable-objects.model"
import { TimerItem } from './models/timer-item.model';
import { PointCoord } from './models/point-coord.model';
import {
  TWO_PI,
  PI_OVER_180,
  LOW_FUEL_THRESHOLD,
  LOW_POWER_THRESHOLD
} from './constants';
import { Explosion, OreMine, EMPBlast, SpaceStation } from './models/apidata.model';



const randomInt = function (min: number, max: number): number  {
  return Math.floor(Math.random() * (max - min) + min)
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function nthRoot(x, root) {
  return Math.pow(x, 1 / root)
}

@Injectable({
  providedIn: 'root'
})
export class DrawingService {

  private deathQuote: QuoteDetails | null = null;

  private actionTileImgEngineLit: HTMLImageElement = new Image()
  private actionTileImgEngineOnline: HTMLImageElement = new Image()
  private actionTileImgScannerOnline: HTMLImageElement = new Image()

  private magnetMineAsset: HTMLImageElement = new Image()

  // TODO: fix magic number
  private spaceStationVisualSideLengthM = 30

  constructor(
    // private _camera: CameraService,
    private _api: ApiService,
    private _formatting: FormattingService,
    private _quote: QuoteService,
    public _user: UserService,
  ) {
    this.deathQuote = this._quote.getQuote()

    this.actionTileImgEngineLit.src = "/static/img/light-engine.jpg"
    this.actionTileImgEngineOnline.src = "/static/img/activate-engine.jpg"
    this.actionTileImgScannerOnline.src = "/static/img/activate-scanner.jpg"
    this.magnetMineAsset.src = "/static/img/magnet-mine.svg"

  }


  public drawMapBoundary(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    mapWallCanvasBoxCoords: BoxCoords,
  ) {
    ctx.beginPath()
    ctx.strokeStyle ="#5e5e00"
    ctx.lineWidth = Math.max(
      2,
      Math.ceil(8 * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
    )
    ctx.rect(
      mapWallCanvasBoxCoords.x1,
      mapWallCanvasBoxCoords.y1,
      mapWallCanvasBoxCoords.x2 - mapWallCanvasBoxCoords.x1,
      mapWallCanvasBoxCoords.y2 - mapWallCanvasBoxCoords.y1,
    )
    ctx.stroke()
  }

  public drawVisionCircles(
    ctx: CanvasRenderingContext2D,
    visionCircles: VisionCircle[],
  ) {
    for(let i in visionCircles) {
      let vs = visionCircles[i]
      const isRadar = vs.name === "radar"
      let endRad: number
      let startRad: number
      if(isRadar) {
        const sensitivity = this._api.frameData.ship.scanner_radar_sensitivity
        const rate = 30// {0:30, 1:20, 2:14, 3:8}[sensitivity]
        const percent = (this._api.frameData.game_frame % rate) / rate
        endRad = TWO_PI * percent
        startRad = endRad - (Math.PI - (Math.PI / randomInt(1, 4)))
      } else {
        startRad = 0
        endRad = TWO_PI
      }
      ctx.beginPath()
      ctx.fillStyle = vs.color
      ctx.arc(
        vs.canvasCoord.x,
        vs.canvasCoord.y,
        vs.radius,
        startRad,
        endRad,
      )
      ctx.fill()
    }
  }

  public drawVisualVelocityElements(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    velocityTrailElements: VelocityTrailElement[],
  ) {
    const cameraPosition = camera.getPosition()
    const now = performance.now()
    for(let i in velocityTrailElements) {
      let vte = velocityTrailElements[i]
      let alpha = (VELOCITY_TRAIL_ELEMENT_TTL_MS - (now - vte.createdAt)) / VELOCITY_TRAIL_ELEMENT_TTL_MS
      let pixelRadius = Math.max(
        2,
        vte.radiusMeters * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
      ) * (vte.grow ? (1 + (3 * (now - vte.createdAt) / VELOCITY_TRAIL_ELEMENT_TTL_MS)): 1) // grow arc to 3x size if grow==true
      let canvasCoord = camera.mapCoordToCanvasCoord(vte.mapCoord, cameraPosition)
      ctx.beginPath()
      ctx.fillStyle = `rgb(140, 140, 140, ${alpha})`
      ctx.arc(canvasCoord.x, canvasCoord.y, pixelRadius, 0, TWO_PI)
      ctx.fill()
    }
  }

  public drawVisualFlameSmokeElements(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    flameSmokeElements: FlameSmokeElement[],
  ){
    const cameraPosition = camera.getPosition()
    const zoom = camera.getZoom()
    const ppm = this._api.frameData.map_config.units_per_meter
    const now = performance.now()
    const maxGrowthCoef = 1.9
    for(let i in flameSmokeElements) {
      let fse = flameSmokeElements[i]
      let agePercent = (now - fse.createdAt) / FLAME_SMOKE_ELEMENT_TTL_MS
      let radiusPx = (fse.initalRadiusMeters + (fse.initalRadiusMeters * maxGrowthCoef * agePercent)) * ppm / zoom
      let alpha = 0.55 - (0.55 * agePercent)
      let canvasCoord = camera.mapCoordToCanvasCoord(fse.mapCoord, cameraPosition)
      ctx.beginPath()
      ctx.fillStyle = `rgb(127, 127, 127, ${alpha})`
      ctx.arc(
        canvasCoord.x, canvasCoord.y,
        radiusPx, 0, TWO_PI
      )
      ctx.fill()
    }
  }

  public drawEMPTrailElements(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    EMPTrailElements: EMPTrailElement[],
  ){
    const cameraPosition = camera.getPosition()
    const zoom = camera.getZoom()
    const ppm = this._api.frameData.map_config.units_per_meter
    const now = performance.now()
    const maxGrowthCoef = 3.5
    for(let i in EMPTrailElements) {
      let empTE = EMPTrailElements[i]
      let agePercent = (now - empTE.createdAt) / EMP_TRAIL_ELEMENT_TTL_MS
      let radiusPx = (empTE.initalRadiusMeters + (empTE.initalRadiusMeters * maxGrowthCoef * agePercent)) * ppm / zoom
      let alpha = 0.55 - (0.55 * agePercent)
      let canvasCoord = camera.mapCoordToCanvasCoord(empTE.mapCoord, cameraPosition)
      ctx.beginPath()
      ctx.fillStyle = `rgb(0, 0, 255, ${alpha})`
      ctx.arc(
        canvasCoord.x, canvasCoord.y,
        radiusPx, 0, TWO_PI
      )
      ctx.fill()
    }
  }

  public drawOreDepositEffect(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
  ) {
    const effectLengthFrames = 30
    if (
      (
        (this._api.frameData.ship.last_ore_deposit_frame + effectLengthFrames)
        < this._api.frameData.game_frame
      )
      || this._api.frameData.game_frame < 100
    ) {
      return
    }
    const ship = this._api.frameData.ship
    const effectFrame = (
      this._api.frameData.game_frame
      - ship.last_ore_deposit_frame
    )

    const shipCanvasCoords = camera.mapCoordToCanvasCoord(
      {x: ship.coord_x, y: ship.coord_y},
      camera.getPosition(),
    )

    const effectRadius = (15 + effectFrame) * 3.5
    const alpha = 0.5 - (effectFrame * 0.015)
    ctx.beginPath()
    ctx.fillStyle = `rgb(255, 255, 0, ${alpha})`
    ctx.arc(
      shipCanvasCoords.x,
      shipCanvasCoords.y,
      effectRadius, 0, TWO_PI,
    )
    ctx.fill()

    const offset = effectLengthFrames - (effectFrame + 1)
    let textCoord = {
      x:shipCanvasCoords.x + 40 + offset,
      y:shipCanvasCoords.y - 40 - offset
    }
    ctx.beginPath()
    ctx.font = '30px Courier New'
    ctx.fillStyle = `rgb(255, 255, 0, ${alpha * 1.25})`
    ctx.fillText("🪙", textCoord.x, textCoord.y)
  }

  public drawWaypoint(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    wayPointMapCoord: PointCoord
  ) {
    const ship = this._api.frameData.ship
    if(!ship.alive) {
      return
    }

    const cameraPosition = camera.getPosition()
    let wpCanvasCoord = camera.mapCoordToCanvasCoord(
      wayPointMapCoord, cameraPosition
    )
    let shipCanvasCoord = camera.mapCoordToCanvasCoord(
      {x: ship.coord_x, y: ship.coord_y}, cameraPosition
    )

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = "rgb(144, 0, 173, 0.5)"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 10]);
    ctx.moveTo(shipCanvasCoord.x, shipCanvasCoord.y)
    ctx.lineTo(wpCanvasCoord.x, wpCanvasCoord.y)
    ctx.stroke()
    ctx.setLineDash([]);
    // Draw flag pole
    const poleHeight = 38
    const flagHeight = 10
    const flagWidth = 12
    ctx.beginPath()
    ctx.fillStyle = "rgb(144, 0, 173, 0.75)"
    ctx.strokeStyle = "rgb(144, 0, 173, 0.75)"
    ctx.moveTo(wpCanvasCoord.x, wpCanvasCoord.y)
    ctx.lineTo(wpCanvasCoord.x, wpCanvasCoord.y - poleHeight)
    ctx.stroke()
    // Draw flag
    ctx.moveTo(wpCanvasCoord.x, wpCanvasCoord.y - poleHeight)
    ctx.lineTo(wpCanvasCoord.x + flagWidth, wpCanvasCoord.y - (poleHeight - flagHeight / 2))
    ctx.lineTo(wpCanvasCoord.x, wpCanvasCoord.y - (poleHeight - flagHeight))
    ctx.closePath()
    ctx.fill()
  }

  public drawVelocityAndHeadingLine(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    visionCircle: VisionCircle,
    headingOnly: boolean = false, // FIXME: garbage parameter.
  ) {
    const alpha = getRandomFloat(0.2, 0.6)
    const ship = this._api.frameData.ship
    if(!ship.alive) {
      return
    }
    // Draw Velocity line if there is any velocity
    if(
      !headingOnly && (ship.velocity_x_meters_per_second !== 0
      || ship.velocity_y_meters_per_second !== 0)
    ) {
      const vAngleRads = camera.getCanvasAngleBetween(
        {x:0, y:0},
        {
          x: visionCircle.canvasCoord.x + ship.velocity_x_meters_per_second * 1000,
          y: visionCircle.canvasCoord.y + ship.velocity_y_meters_per_second * 1000,
        }
      ) * (Math.PI / 180)
      const velocityLinePointB = {
        x: visionCircle.canvasCoord.x + (visionCircle.radius * Math.sin(vAngleRads)),
        y: visionCircle.canvasCoord.y + (visionCircle.radius * Math.cos(vAngleRads)),
      }
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = `rgb(144, 0, 173, ${alpha})`
      ctx.moveTo(visionCircle.canvasCoord.x, visionCircle.canvasCoord.y)
      ctx.lineTo(velocityLinePointB.x, velocityLinePointB.y)
      ctx.stroke()

      ctx.beginPath()
      ctx.fillStyle = `rgb(144, 0, 173, ${alpha})`
      ctx.arc(velocityLinePointB.x, velocityLinePointB.y, 8, 0, TWO_PI)
      ctx.fill()
    }

    // Draw heading line
    const hAngleRads = (180 - ship.heading) * PI_OVER_180 // why -180? because it works.
    const headingLinePointB = {
      x: visionCircle.canvasCoord.x + (visionCircle.radius * Math.sin(hAngleRads)),
      y: visionCircle.canvasCoord.y + (visionCircle.radius * Math.cos(hAngleRads)),
    }
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = `rgb(144, 0, 173, ${alpha})`
    ctx.moveTo(visionCircle.canvasCoord.x, visionCircle.canvasCoord.y)
    ctx.lineTo(headingLinePointB.x, headingLinePointB.y)
    ctx.stroke()
  }

  public drawLineToScannerCursor(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    scannerTargetID: string,
  ) {
    if(Math.random() < 0.5) {
      return
    }
    const target = this._api.frameData.ship.scanner_ship_data.find(
      sde=>sde.id === scannerTargetID)
    if(!target) {
      return
    }
    const cameraPosition = camera.getPosition()
    const alpha = getRandomFloat(0.2, 0.6)
    const pointA = camera.mapCoordToCanvasCoord(
      {x:this._api.frameData.ship.coord_x, y:this._api.frameData.ship.coord_y},
      cameraPosition,
    )
    const pointB = camera.mapCoordToCanvasCoord(
      {x:target.coord_x, y:target.coord_y},
      cameraPosition,
    )
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = `rgb(190, 0, 0,  ${alpha})`
    ctx.moveTo(pointA.x, pointA.y)
    ctx.lineTo(pointB.x, pointB.y)
    ctx.stroke()
  }

  public drawEbeams(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    rays: EBeamRayDetails[],
  ) {
    const ebeamThickness = camera.getEBeamLineThickness()
    for(let i in rays) {
      let ray = rays[i]
      ctx.beginPath()
      ctx.strokeStyle = ray.color
      ctx.lineWidth = ebeamThickness
      ctx.moveTo(ray.startPoint.x, ray.startPoint.y)
      ctx.lineTo(ray.endPoint.x, ray.endPoint.y)
      ctx.stroke()
    }
  }

  public drawBottomRightOverlay(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
  ) {
    const brcYInterval = 45
    let brcYOffset = 30
    const brcXOffset = 15
    const timerBarLength = Math.round(camera.canvasWidth / 8)
    const textRAlignXOffset = brcXOffset + timerBarLength + 10
    const barRAlignXOffset = brcXOffset + timerBarLength

    // Game Time
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.textAlign = 'right'
    ctx.font = 'bold 24px Courier New'
    ctx.beginPath()
    ctx.fillText(
      this._api.frameData.elapsed_time,
      camera.canvasWidth - 15,
      camera.canvasHeight - brcYOffset,
    )

    // Timers
    if(this._api.frameData.ship.alive){
      ctx.font = '20px Courier New'
      ctx.strokeStyle = '#00ff00'
      ctx.fillStyle = '#00ff00'
      brcYOffset += brcYInterval
      for(let i in this._api.frameData.ship.timers) {
        const timer: TimerItem = this._api.frameData.ship.timers[i]
        const fillLength = Math.round((timer.percent / 100) * timerBarLength)
        ctx.beginPath()
        ctx.fillText(
          timer.name,
          camera.canvasWidth - textRAlignXOffset,
          camera.canvasHeight - brcYOffset,
        )
        ctx.beginPath()
        ctx.rect(
          camera.canvasWidth - barRAlignXOffset, //    top left x
          camera.canvasHeight - (brcYOffset + 20),  // top left y
          timerBarLength, // width
          30,             // height
        )
        ctx.stroke()
        ctx.beginPath()
        ctx.rect(
          camera.canvasWidth - barRAlignXOffset, //    top left x
          camera.canvasHeight - (brcYOffset + 20),  // top left y
          fillLength, // width
          30,         // height
        )
        ctx.fill()
        brcYOffset += brcYInterval
      }
    }
  }

  public drawTopRightOverlay(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    waypointMapCoord: PointCoord | null,
  ) {
    // Gyroscope circle
    const buffer = 3;
    const gryroscopeRadius = Math.floor(camera.canvasHalfHeight / 8)
    const gryroscopeX = camera.canvasWidth - (gryroscopeRadius + buffer)
    const gryroscopeY = gryroscopeRadius + buffer
    ctx.beginPath()
    ctx.fillStyle = "rgb(255, 255, 255, 0.65)"
    ctx.arc(
      gryroscopeX,
      gryroscopeY,
      gryroscopeRadius,
      0,
      TWO_PI,
    )
    ctx.fill()

    // Gyroscope relative velocity indicator line
    if(
      this._api.frameData.ship.velocity_x_meters_per_second
      || this._api.frameData.ship.velocity_y_meters_per_second
    ) {
      const angleRads = camera.getCanvasAngleBetween(
        {x:0, y:0},
        {
          x: gryroscopeX + this._api.frameData.ship.velocity_x_meters_per_second * 1000,
          y: gryroscopeY + this._api.frameData.ship.velocity_y_meters_per_second * 1000,
        }
      ) * (Math.PI / 180)
      const gyroLinePointB = {
        x: gryroscopeX + Math.round(gryroscopeRadius * Math.sin(angleRads)),
        y: gryroscopeY + Math.round(gryroscopeRadius * Math.cos(angleRads)),
      }
      ctx.beginPath()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.moveTo(gryroscopeX, gryroscopeY)
      ctx.lineTo(gyroLinePointB.x, gyroLinePointB.y)
      ctx.stroke()
    }

    // Scanner Traversal Crosshairs
    if(this._api.frameData.ship.scanner_lock_traversal_slack !== null) {
      const crossOffset = gryroscopeRadius * this._api.frameData.ship.scanner_lock_traversal_slack
      ctx.beginPath()
      ctx.strokeStyle = 'rgb(255, 0, 0, 0.75)'
      ctx.lineWidth = 4
      // Verticle hairs
      ctx.moveTo(gryroscopeX - crossOffset, gryroscopeY - gryroscopeRadius)
      ctx.lineTo(gryroscopeX - crossOffset, gryroscopeY + gryroscopeRadius)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(gryroscopeX + crossOffset, gryroscopeY - gryroscopeRadius)
      ctx.lineTo(gryroscopeX + crossOffset, gryroscopeY + gryroscopeRadius)
      ctx.stroke()

      // Horizontal hairs
      ctx.beginPath()
      ctx.moveTo(gryroscopeX - gryroscopeRadius, gryroscopeY - crossOffset)
      ctx.lineTo(gryroscopeX + gryroscopeRadius, gryroscopeY - crossOffset)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(gryroscopeX - gryroscopeRadius, gryroscopeY + crossOffset)
      ctx.lineTo(gryroscopeX + gryroscopeRadius, gryroscopeY + crossOffset)
      ctx.stroke()
    }

    // Velocity Text
    const velocity = Math.sqrt(
      Math.pow(this._api.frameData.ship.velocity_x_meters_per_second, 2)
      + Math.pow(this._api.frameData.ship.velocity_y_meters_per_second, 2)
    ).toFixed(1)
    ctx.beginPath()
    ctx.font = 'bold 22px Courier New'
    ctx.fillStyle = 'rgb(255, 181, 43,  0.95)'
    ctx.textAlign = 'right'
    ctx.fillText(
      velocity + " M/S",
      camera.canvasWidth - 3,
      gryroscopeY + gryroscopeRadius + 18,
    )
    // Thermal Signature Text
    ctx.beginPath()
    ctx.fillText(
      this._api.frameData.ship.scanner_thermal_signature + " IR ",
      camera.canvasWidth - 3,
      gryroscopeY + gryroscopeRadius + 40,
    )

    // Waypoint distance test
    if (waypointMapCoord !== null) {
      const ship = this._api.frameData.ship
      const shipMapCoord = {x:ship.coord_x, y: ship.coord_y}
      const metersDist = Math.floor(
        Math.sqrt(
          Math.pow(shipMapCoord.x - waypointMapCoord.x, 2)
          + Math.pow(shipMapCoord.y - waypointMapCoord.y, 2)
        )
        / this._api.frameData.map_config.units_per_meter
      )
      ctx.beginPath()
      ctx.fillStyle = "rgb(193, 113, 209, 0.95)"
      ctx.fillText(
        `WP ${metersDist} M`,
        camera.canvasWidth - 3,
        gryroscopeY + gryroscopeRadius + 65,
      )
    }
  }

  public drawTopLeftOverlay(
    ctx: CanvasRenderingContext2D,
    cameraMode: string,
  ) {
    const tlcYInterval = 34
    const tlcKFYInterval = 28
    let tlcYOffset = 25
    const tlcXOffset = 15
    if(this._api.frameData.ship.alive){
      // Fuel amount
      ctx.beginPath()
      ctx.font = '24px Courier New'
      ctx.fillStyle = '#fcb8b8'
      ctx.textAlign = 'left'
      ctx.fillText("⛽ " + this._formatting.formatNumber(this._api.frameData.ship.fuel_level), tlcXOffset, tlcYOffset)
      tlcYOffset += tlcYInterval

      // Battery amount
      ctx.beginPath()
      ctx.fillStyle = '#fcf9b8'
      ctx.fillText("🔋 " + this._formatting.formatNumber(this._api.frameData.ship.battery_power), tlcXOffset, tlcYOffset)
      tlcYOffset += tlcYInterval

      // Ore amount
      const realOreKg = this._formatting.formatNumber(this._api.frameData.ship.cargo_ore_mass_kg)
      const virtualOreKg = this._formatting.formatNumber(this._api.frameData.ship.virtual_ore_kg)
      ctx.beginPath()
      ctx.fillStyle = '#fce8b8'
      ctx.fillText(`💎 ${realOreKg} / 🪙 ${virtualOreKg}`, tlcXOffset, tlcYOffset)
      tlcYOffset += tlcYInterval

      // Camera mode
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.fillText("🎥 " + cameraMode.toUpperCase(), tlcXOffset, tlcYOffset)
      tlcYOffset += tlcYInterval
    }
    // Killfeed (TOP LEFT)
    tlcYOffset += tlcYInterval
    ctx.font = '20px Courier New'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    for(let i in this._api.frameData.killfeed) {
      const kfe = this._api.frameData.killfeed[i]
      ctx.beginPath()
      ctx.fillText("💀 " + kfe.victim_name, tlcXOffset, tlcYOffset)
      tlcYOffset += tlcKFYInterval
    }
  }

  public drawBottomLeftOverlay(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    isCameraModeMap: boolean,
    pneumaticWeaponMsg: string,
  ) {
    let lrcYOffset = camera.canvasHeight - 30
    let lrcYInterval = 40
    const lrcXOffset = 15
    // Scale Bar
    const barLengthMeters = (
      (
        (camera.canvasWidth / 4)
        * camera.getZoom()
      )
      / this._api.frameData.map_config.units_per_meter
    )
    let scaleLabel;
    if(barLengthMeters >= 5000) {
      scaleLabel = (barLengthMeters / 1000).toFixed(2) + " KM"
    }
    else {
      scaleLabel = Math.round(barLengthMeters) + " Meters"
    }
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 3
    ctx.moveTo(lrcXOffset, lrcYOffset);
    ctx.lineTo((camera.canvasWidth / 4) + lrcXOffset, lrcYOffset);
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(lrcXOffset, lrcYOffset);
    ctx.lineTo( lrcXOffset, lrcYOffset - 10);
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo((camera.canvasWidth / 4) + lrcXOffset, lrcYOffset);
    ctx.lineTo((camera.canvasWidth / 4) + lrcXOffset, lrcYOffset - 10);
    ctx.stroke()
    // Scale meters and user handle
    ctx.beginPath()
    ctx.font = '24px serif'
    ctx.fillStyle = this._api.frameData.ship.alive ? '#ffffff' : "#ff0000";
    ctx.textAlign = 'left'
    ctx.fillText(scaleLabel, lrcXOffset + 8, lrcYOffset - 12)
    if(isCameraModeMap) {
      return
    }
    lrcYOffset -= lrcYInterval
    ctx.beginPath()
    ctx.font = '20px Courier New'
    ctx.fillText("Ensign " + this._user.handle, lrcXOffset, lrcYOffset)
    lrcYOffset -= lrcYInterval
    // Red alerts
    if(this._api.frameData.ship.alive) {
      lrcYInterval = 30
      ctx.font = 'bold 22px courier new'
      const redalertColorAlpha = this._api.frameData.game_frame % 70 > 35 ? "1" : "0.65"
      ctx.fillStyle = `rgb(255, 2, 2, ${redalertColorAlpha})`
      if(this._api.frameData.ship.fuel_level < LOW_FUEL_THRESHOLD) {
        ctx.beginPath()
        ctx.fillText("⚠️ LOW FUEL", lrcXOffset, lrcYOffset)
        lrcYOffset -= lrcYInterval + 5
      }
      if(this._api.frameData.ship.battery_power < LOW_POWER_THRESHOLD) {
        ctx.beginPath()
        ctx.fillText("⚠️ LOW POWER", lrcXOffset, lrcYOffset)
        lrcYOffset -= lrcYInterval + 5
      }

      // Selected Pneumatic Weapon
      ctx.beginPath()
      ctx.fillStyle = "#ffffff"
      ctx.font = 'bold 22px Courier New'
      ctx.fillText(pneumaticWeaponMsg, lrcXOffset, lrcYOffset)
      lrcYOffset -= lrcYInterval

      if (this._api.frameData.ship.engine_lit) {
        ctx.drawImage(
          this.actionTileImgEngineLit,
          lrcXOffset,
          lrcYOffset - 100,
          100, 100,
        )
        lrcYOffset -= 120
      }
      else if (this._api.frameData.ship.engine_online || this._api.frameData.ship.engine_starting) {
        ctx.drawImage(
          this.actionTileImgEngineOnline,
          lrcXOffset,
          lrcYOffset - 100,
          100, 100,
        )
        lrcYOffset -= 120
      }
      if(this._api.frameData.ship.scanner_online || this._api.frameData.ship.scanner_starting) {
        ctx.drawImage(
          this.actionTileImgScannerOnline,
          lrcXOffset,
          lrcYOffset - 100,
          100, 100,
        )
        lrcYOffset -= 120
      }
    }
  }

  public drawFrontAndCenterAlerts(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
  ) {
    // This function executes 1 if block and NOTHING MORE. (some have return statements.)
    if (this._api.frameData.winning_team == this._api.frameData.ship.team_id) {
      ctx.beginPath()
      ctx.font = 'bold 65px courier new'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText("🏆VICTORY", camera.canvasHalfWidth, camera.canvasHalfHeight / 2)
    }
    else if(!this._api.frameData.ship.alive) {
      if((this._api.frameData.ship.died_on_frame + 100) > this._api.frameData.game_frame) {
        // delay showing death quote
        return;
      }
      ctx.beginPath()
      ctx.font = 'bold 56px courier new'
      ctx.fillStyle = '#ff0000'
      ctx.textAlign = 'center'
      let deathTextYOffset = camera.canvasHalfHeight / 3
      const deathQuoteOffset = 50
      if(this._api.frameData.game_frame % 50 > 25) {
        ctx.fillText("GAME OVER", camera.canvasHalfWidth, deathTextYOffset)
      }
      deathTextYOffset += (deathQuoteOffset * 2)
      ctx.beginPath()
      ctx.fillStyle = '#b8b8b8' // medium light gray
      ctx.textAlign = 'left'
      ctx.font = `bold 40px Verdana`
      for(let i in this.deathQuote.lines) {
        const prefix = parseInt(i) === 0 ? '"' : ""
        ctx.fillText(prefix + this.deathQuote.lines[i], 100, deathTextYOffset)
        deathTextYOffset += deathQuoteOffset
      }
      ctx.font = 'bold 32px Verdana'
      deathTextYOffset += deathQuoteOffset * 0.5
      ctx.beginPath()
      ctx.fillText("- " + (this.deathQuote.author || "Unknown"), 100, deathTextYOffset)
    }
    else if(this._api.frameData.ship.docked_at_station) {
      const station = this._api.frameData.space_stations.find(
        s => s.uuid == this._api.frameData.ship.docked_at_station
      )
      ctx.beginPath()
      ctx.font = 'bold 32px courier new'
      ctx.fillStyle = '#00ff00'
      ctx.textAlign = 'left'
      ctx.fillText(
        "Docked at",
        camera.canvasHalfWidth / 3,
        camera.canvasHalfHeight / 2
      )
      ctx.font = 'bold 38px courier new'
      ctx.fillText(
        station.name,
        camera.canvasHalfWidth / 3,
        camera.canvasHalfHeight / 2 + 45
      )
    }
    else if (this._api.frameData.ship.parked_at_ore_mine) {
      const oreMine = this._api.frameData.ore_mines.find(
        om => om.uuid == this._api.frameData.ship.parked_at_ore_mine
      )
      ctx.beginPath()
      ctx.font = 'bold 32px courier new'
      ctx.fillStyle = '#00ff00'
      ctx.textAlign = 'left'
      ctx.fillText(
        "Parked at",
        camera.canvasHalfWidth / 3,
        camera.canvasHalfHeight / 2
      )
      ctx.font = 'bold 38px courier new'
      ctx.fillText(
        oreMine.name,
        camera.canvasHalfWidth / 3,
        camera.canvasHalfHeight / 2 + 45
      )
    }
  }

  private drawAflameEffect(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    canvasCoord: PointCoord,
    fireBallRadiusCanvasPx: number,
  ) {
    // Draw dancing fireballs
    for(let i=0; i<3; i++) {
      let tFlameRadius = fireBallRadiusCanvasPx + randomInt(
        fireBallRadiusCanvasPx / 4,
        fireBallRadiusCanvasPx * 4,
      )
      const quarterFlameRadius = Math.max(1, Math.round(tFlameRadius / 4))
      ctx.beginPath()
      ctx.fillStyle = `rgb(255, 0, 0, 0.${randomInt(2, 5)})`
      ctx.arc(
        canvasCoord.x + randomInt(-1 * quarterFlameRadius, quarterFlameRadius),
        canvasCoord.y + randomInt(-1 * quarterFlameRadius, quarterFlameRadius),
        tFlameRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
    }
    // Draw flame sparks
    const sparkLineCount = randomInt(-8, 2)
    ctx.lineWidth = Math.max(1, Math.floor(3 / camera.getZoom()))
    for(let i=0; i<sparkLineCount; i++) {
      let lineLength = fireBallRadiusCanvasPx * randomInt(9, 12)
      let angle = randomInt(0, 359)
      let linep1 = camera.getCanvasPointAtLocation(
        canvasCoord,
        angle,
        randomInt(0, Math.max(1, Math.floor(fireBallRadiusCanvasPx / 3))),
      )
      let linep2 = camera.getCanvasPointAtLocation(
        canvasCoord,
        angle,
        lineLength,
      )
      ctx.beginPath()
      ctx.strokeStyle = `rgb(255, 255, 0, 0.8)`
      ctx.moveTo(linep1.x, linep1.y)
      ctx.lineTo(linep2.x, linep2.y)
      ctx.stroke()
    }
  }

  public drawEMPBlasts(ctx: CanvasRenderingContext2D, camera: Camera) {
    for(let i in this._api.frameData.emp_blasts) {
      this.drawEMPBlast(
        ctx,
        camera,
        this._api.frameData.emp_blasts[i]
      )
    }
  }

  private drawEMPBlast(ctx: CanvasRenderingContext2D, camera: Camera, empBlast: EMPBlast){
    const ppm = this._api.frameData.map_config.units_per_meter
    const zoom = camera.getZoom()
    const cameraPosition = camera.getPosition()
    let radiusMeters: number, radiusPx: number
    const canvasCoord = camera.mapCoordToCanvasCoord(
      {x:empBlast.origin_point[0], y:empBlast.origin_point[1]},
      cameraPosition,
    )
    if(empBlast.elapsed_ms < empBlast.flare_ms) {
      const percentCompleteTime = empBlast.elapsed_ms / empBlast.flare_ms
      const percentCompleteFlareRadius = nthRoot(percentCompleteTime, 2) // x=y^2
      radiusMeters = Math.max(1, percentCompleteFlareRadius * empBlast.max_radius_meters)
      radiusPx = radiusMeters * ppm / zoom
      const maxRadiusPx = empBlast.max_radius_meters * ppm / zoom
      for(let i=0; i<3; i++) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(0, 0, 255, 0.${randomInt(2, 5)})`
        ctx.arc(
          canvasCoord.x + getRandomFloat(-1.5, 1.5) * ppm / zoom,
          canvasCoord.y + getRandomFloat(-1.5, 1.5) * ppm / zoom,
          radiusPx * getRandomFloat(0.75, 1.25),
          0,
          TWO_PI,
        )
        ctx.fill()
      }
      const dotCt = 8
      const dotRadiusPx = Math.max(1, 1.25 * ppm / zoom)
      for(let i=0; i<dotCt; i++) {
        ctx.beginPath()
        ctx.fillStyle = 'rgb(0, 0, 255)'
        ctx.arc(
          canvasCoord.x + getRandomFloat(-1 * maxRadiusPx,  maxRadiusPx),
          canvasCoord.y + getRandomFloat(-1 * maxRadiusPx, maxRadiusPx),
          dotRadiusPx,
          0,
          TWO_PI,
        )
        ctx.fill()
      }
    }
    else if(empBlast.elapsed_ms < (empBlast.flare_ms + empBlast.fade_ms)) {
      // Fadeout emp blast
      const elapsedFade = empBlast.elapsed_ms - empBlast.flare_ms
      const fadePercent = elapsedFade / empBlast.fade_ms
      const startRadius = empBlast.max_radius_meters
      const endRadius = empBlast.max_radius_meters * 1.4
      radiusMeters = startRadius + (endRadius - startRadius) * fadePercent
      const fadeRadiusPx = radiusMeters * ppm / zoom
      const alpha = 0.4 - (0.4 * fadePercent)
      ctx.beginPath()
      ctx.fillStyle = `rgb(0, 0, 255, ${alpha})`
      ctx.arc(
        canvasCoord.x,
        canvasCoord.y,
        Math.round(fadeRadiusPx),
        0,
        TWO_PI,
      )
      ctx.fill()
      const dotCt = Math.ceil((1 - fadePercent) * 8)
      const dotRadiusPx = Math.max(1, 0.7 * ppm / zoom)
      for(let i=0; i<dotCt; i++) {
        ctx.beginPath()
        ctx.fillStyle = 'rgb(0, 0, 255, 0.75)'
        ctx.arc(
          canvasCoord.x + getRandomFloat(-1 * fadeRadiusPx,  fadeRadiusPx),
          canvasCoord.y + getRandomFloat(-1 * fadeRadiusPx, fadeRadiusPx),
          dotRadiusPx,
          0,
          TWO_PI,
        )
        ctx.fill()
      }
    }
  }

  public drawExplosions(ctx: CanvasRenderingContext2D, camera: Camera) {
    for(let i in this._api.frameData.explosions) {
      this.drawExplosion(
        ctx,
        camera,
        this._api.frameData.explosions[i],
      )
    }
  }

  private drawExplosion(ctx: CanvasRenderingContext2D, camera: Camera, ex: Explosion) {
    const ppm = this._api.frameData.map_config.units_per_meter
    const zoom = camera.getZoom()
    const cameraPosition = camera.getPosition()
    let radiusMeters: number, radiusPx: number
    const canvasCoord = camera.mapCoordToCanvasCoord(
      {x:ex.origin_point[0], y:ex.origin_point[1]},
      cameraPosition,
    )
    const maxFireBallRadiusCanvasPx = ex.max_radius_meters * ppm / zoom
    if(ex.elapsed_ms < ex.flame_ms) {
      const percentCompleteTime = ex.elapsed_ms / ex.flame_ms
      const percentCompleteFlameRadius = nthRoot(percentCompleteTime, 2) // x=y^2
      radiusMeters = Math.max(1, percentCompleteFlameRadius * ex.max_radius_meters + randomInt(-2, 2))
      radiusPx = radiusMeters * ppm / zoom

      // Primary fireball
      ctx.beginPath()
      ctx.fillStyle = `rgb(255, 0, 0, 0.${randomInt(4, 8)})`
      ctx.arc(
        canvasCoord.x + randomInt(-3, 3),
        canvasCoord.y + randomInt(-3, 3),
        radiusPx,
        0,
        TWO_PI,
      )
      ctx.fill()
      // Inner sub fireballs and sparks
      if(percentCompleteTime < 0.4) {
        // Inner fireballs
        const subFireBallsCount = randomInt(2, 4)
        for(let i=0; i<subFireBallsCount; i++) {
          let subFBSizePx = Math.floor(radiusMeters / getRandomFloat(2, 4)) * ppm / zoom
          ctx.beginPath()
          ctx.fillStyle = `rgb(255, ${randomInt(50, 200)}, 0, 0.${randomInt(3, 6)})`
          ctx.arc(
            canvasCoord.x + randomInt(-4, 4),
            canvasCoord.y + randomInt(-4, 4),
            subFBSizePx,
            0,
            TWO_PI,
          )
          ctx.fill()
        }
        // sparks
        const sparksPercComplete = percentCompleteTime / 0.4
        const dotCt = Math.ceil((1 - sparksPercComplete) * 12)
        const dotRadiusPx = Math.max(1, 1 * ppm / zoom)
        const exMaxRadiusMeters = ex.max_radius_meters * getRandomFloat(1, 1.2) * ppm / zoom
        const maxAlpha = 1 - sparksPercComplete
        for(let i=0; i<dotCt; i++) {
          ctx.beginPath()
          ctx.fillStyle = `rgb(255, 255, ${Math.max(0.25, maxAlpha)})`
          ctx.arc(
            canvasCoord.x + getRandomFloat(-1 * exMaxRadiusMeters, exMaxRadiusMeters),
            canvasCoord.y + getRandomFloat(-1 * exMaxRadiusMeters, exMaxRadiusMeters),
            dotRadiusPx,
            0,
            TWO_PI,
          )
          ctx.fill()
        }
      }
      // Debris lines
      const debrisLineCount = randomInt(-6, 6)
      ctx.beginPath()
      ctx.lineWidth = 2
      for(let i=0; i<debrisLineCount; i++) {
        let lineLength = maxFireBallRadiusCanvasPx * randomInt(1, 6)
        let angle = randomInt(0, 359)
        let linep1 = camera.getCanvasPointAtLocation(
          canvasCoord,
          angle,
          randomInt(0, Math.max(1, Math.floor(maxFireBallRadiusCanvasPx / 10))),
        )
        let linep2 = camera.getCanvasPointAtLocation(
          canvasCoord,
          angle,
          lineLength,
        )
        ctx.beginPath()
        ctx.strokeStyle = `rgb(255, 220, 220, 0.${randomInt(2, 9)})`
        ctx.moveTo(linep1.x, linep1.y)
        ctx.lineTo(linep2.x, linep2.y)
        ctx.stroke()
      }
    }
    else if(ex.elapsed_ms < (ex.flame_ms + ex.fade_ms)) {
      // Fadeout smoke puff
      const elapsedFade = ex.elapsed_ms - ex.flame_ms
      const fadePercent = elapsedFade / ex.fade_ms
      const startRadius = ex.max_radius_meters
      const endRadius = ex.max_radius_meters * 1.4
      radiusMeters = startRadius + (endRadius - startRadius) * fadePercent
      const fadeRadiusPx = radiusMeters * ppm / zoom
      const alpha = 0.4 - (0.4 * fadePercent)
      ctx.beginPath()
      ctx.fillStyle = `rgb(255, 0, 0, ${alpha})`
      ctx.arc(
        canvasCoord.x,
        canvasCoord.y,
        Math.round(fadeRadiusPx),
        0,
        TWO_PI,
      )
      ctx.fill()
    }
  }

  public drawExplosionShockwaves(ctx: CanvasRenderingContext2D, camera: Camera,) {
    if (!this._api.frameData.explosion_shockwaves.length) {
      return
    }
    this._api.frameData.explosion_shockwaves.forEach(esw => {
      this.drawExplosionShockwave(ctx, camera, esw)
    })
  }

  public drawExplosionShockwave(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    esw: {id: string, origin_point: Array<number>, radius_meters: number}
  ) {

    const _explosion_shockwave_max_radius_meters = 4000
    const fillAlpha = 0.12 * (1 - esw.radius_meters / _explosion_shockwave_max_radius_meters)
    const startFadeOutAtMeters = _explosion_shockwave_max_radius_meters * 0.92;
    let alphaMultiplier = 1
    if(esw.radius_meters > startFadeOutAtMeters) {
      alphaMultiplier = 1 - ((esw.radius_meters - startFadeOutAtMeters) / (_explosion_shockwave_max_radius_meters - startFadeOutAtMeters))
    }

    // Primary arc
    ctx.beginPath()
    ctx.strokeStyle = `rgb(127, 127, 127, ${getRandomFloat(0.3, 0.7) * alphaMultiplier})`
    ctx.fillStyle = `rgb(255, 255, 255, ${fillAlpha})`
    ctx.lineWidth = Math.max(
      2,
      Math.ceil(10 * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
    )
    const swCenterCanvasCoord = camera.mapCoordToCanvasCoord(
      {x: esw.origin_point[0], y: esw.origin_point[1]},
      camera.getPosition()
    )
    const radiusCanvasPx = esw.radius_meters * this._api.frameData.map_config.units_per_meter / camera.getZoom()
    ctx.arc(swCenterCanvasCoord.x, swCenterCanvasCoord.y, radiusCanvasPx, 0, TWO_PI)
    ctx.stroke()
    ctx.fill()

    // Suplementary arcs
    ctx.beginPath()
    ctx.strokeStyle = `rgb(127, 127, 127, ${getRandomFloat(0.3, 0.7) * alphaMultiplier})`
    const radiusCanvasPx1 = Math.max(1, radiusCanvasPx + randomInt(
      -30 * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
      30 * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
    ))
    ctx.arc(swCenterCanvasCoord.x, swCenterCanvasCoord.y, radiusCanvasPx1, 0, TWO_PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = `rgb(127, 127, 127, ${getRandomFloat(0.3, 0.7) * alphaMultiplier})`
    const radiusCanvasPx2 = Math.max(1, radiusCanvasPx + randomInt(
      -30 * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
      30 * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
    ))
    ctx.arc(swCenterCanvasCoord.x, swCenterCanvasCoord.y, radiusCanvasPx2, 0, TWO_PI)
    ctx.stroke()
  }

  public drawShip(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    drawableShip: DrawableShip,
    scannerTargetIDCursor: string | null,
    drawBoundingBox: boolean,
  ) {

    if(drawableShip.exploded){
      return
    }

    if (drawableShip.isDot) {
      ctx.beginPath()
      ctx.fillStyle = "rgb(0, 255, 0, 0.9)"
      ctx.arc(
        drawableShip.canvasCoordCenter.x,
        drawableShip.canvasCoordCenter.y,
        camera.minSizeForDotPx - 1,
        0,
        TWO_PI,
      )
      ctx.fill()
    }

    if(drawableShip.visualEbeamCharging) {
      if(Math.random() < 0.80) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(255, 0, 0, 0.0${randomInt(5, 7)})`
        ctx.arc(
          drawableShip.canvasCoordCenter.x,
          drawableShip.canvasCoordCenter.y,
          Math.ceil(randomInt(35, 50) * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
          0, TWO_PI,
        )
        ctx.fill()
      }
      if(Math.random() < 0.5) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(255, 0, 0, 0.3${randomInt(2, 9)})`
        ctx.arc(
          drawableShip.canvasCoordCenter.x,
          drawableShip.canvasCoordCenter.y,
          Math.ceil(randomInt(20, 25) * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
          0, TWO_PI,
        )
        ctx.fill()
      }
      if(Math.random() < 0.3) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(255, 0, ${randomInt(0, 255)}, 0.${randomInt(4, 7)})`
        ctx.arc(
          drawableShip.canvasCoordCenter.x,
          drawableShip.canvasCoordCenter.y,
          Math.ceil(randomInt(5, 10) * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
          0, TWO_PI,
        )
        ctx.fill()
      }
      if(Math.random() < 0.5) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(255, 0, ${randomInt(0, 255)}, 0.${randomInt(6, 8)})`
        ctx.arc(
          drawableShip.canvasCoordP1.x,
          drawableShip.canvasCoordP1.y,
          Math.ceil(1 * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
          0, TWO_PI,
        )
        ctx.fill()
      }
      if(Math.random() < 0.5) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(255, 0, ${randomInt(0, 255)}, 0.${randomInt(6, 8)})`
        ctx.arc(
          drawableShip.canvasCoordP2.x,
          drawableShip.canvasCoordP2.y,
          Math.ceil(1 * this._api.frameData.map_config.units_per_meter / camera.getZoom()),
          0, TWO_PI,
        )
        ctx.fill()
      }
    }

    // Visual Shake x/y offsets
    let vsxo = 0, vsyo = 0;
    if(
      drawableShip.isSelf
      // && !drawableShip.isDot
      && this._api.lastShockwaveFrame !== null
      && (this._api.lastShockwaveFrame + 75) > this._api.frameData.game_frame
    ) {
      const percentThroughShake = (this._api.frameData.game_frame - this._api.lastShockwaveFrame) / 75
      const shakeReduction = 1 - percentThroughShake
      const xOffsetM = getRandomFloat(-2 * shakeReduction, 2 * shakeReduction)
      const yOffsetM = getRandomFloat(-2 * shakeReduction, 2 * shakeReduction)
      vsxo = xOffsetM * this._api.frameData.map_config.units_per_meter / camera.getZoom()
      vsyo = yOffsetM * this._api.frameData.map_config.units_per_meter / camera.getZoom()
    }
    // Ship is within visual range
    // fin 0
    ctx.beginPath()
    ctx.fillStyle = drawableShip.fillColor
    ctx.moveTo(drawableShip.canvasCoordP0.x + vsxo, drawableShip.canvasCoordP0.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordFin0P0.x + vsxo, drawableShip.canvasCoordFin0P0.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordFin0P1.x + vsxo, drawableShip.canvasCoordFin0P1.y + vsyo)
    ctx.closePath()
    ctx.fill()
    // fin 1
    ctx.beginPath()
    ctx.moveTo(drawableShip.canvasCoordP3.x + vsxo, drawableShip.canvasCoordP3.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordFin1P0.x + vsxo, drawableShip.canvasCoordFin1P0.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordFin1P1.x + vsxo, drawableShip.canvasCoordFin1P1.y + vsyo)
    ctx.closePath()
    ctx.fill()
    // body
    ctx.beginPath()
    ctx.moveTo(drawableShip.canvasCoordP0.x + vsxo, drawableShip.canvasCoordP0.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordP1.x + vsxo, drawableShip.canvasCoordP1.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordP2.x + vsxo, drawableShip.canvasCoordP2.y + vsyo)
    ctx.lineTo(drawableShip.canvasCoordP3.x + vsxo, drawableShip.canvasCoordP3.y + vsyo)
    ctx.closePath()
    ctx.fill()
    if(drawableShip.visualEbeamCharging) {
      ctx.strokeStyle = "#ff0000"
      ctx.lineWidth = randomInt(1, 4)
      ctx.stroke()
    }
    if(drawableShip.engineLit) {
      const engineFlameX = Math.round((drawableShip.canvasCoordP3.x + drawableShip.canvasCoordP0.x) / 2)
      const engineFlameY = Math.round((drawableShip.canvasCoordP3.y + drawableShip.canvasCoordP0.y) / 2)
      let engineOuterFlameRadius = Math.max(2, Math.round(
        Math.sqrt(
          (Math.pow(drawableShip.canvasCoordP3.x - drawableShip.canvasCoordP0.x, 2)
          + Math.pow(drawableShip.canvasCoordP3.y - drawableShip.canvasCoordP0.y, 2))
        ) / 2
      ) * (drawableShip.engineBoosted ? 4 : 1))
      engineOuterFlameRadius += randomInt(engineOuterFlameRadius / 4, engineOuterFlameRadius)
      ctx.beginPath()
      ctx.fillStyle = drawableShip.engineBoosted ? "rgb(71, 139, 255)" : "rgb(255, 0, 0, 0.9)"
      ctx.arc(
        engineFlameX,
        engineFlameY,
        engineOuterFlameRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 186, 89, 0.8)"
      const engineInnerFlameRadius = Math.floor(engineOuterFlameRadius / 2) + randomInt(
        engineOuterFlameRadius / -5, engineOuterFlameRadius / 5
      )
      ctx.arc(
        engineFlameX + randomInt(engineInnerFlameRadius / -4, engineInnerFlameRadius / 4),
        engineFlameY + randomInt(engineInnerFlameRadius / -4, engineInnerFlameRadius / 4),
        engineInnerFlameRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
    }

    if(drawableShip.gravityBrakePosition > 0) {
      const fullyDesployedRadius = Math.ceil(
        Math.sqrt(
          Math.pow(drawableShip.canvasCoordP1.x - drawableShip.canvasCoordP2.x, 2)
          + Math.pow(drawableShip.canvasCoordP1.y - drawableShip.canvasCoordP2.y, 2)
        )
      )

      let currentRadius = Math.ceil(
        fullyDesployedRadius * (
          drawableShip.gravityBrakePosition / drawableShip.gravityBrakeDeployedPosition
        )
      )
      if(drawableShip.gravityBrakeActive) {
        currentRadius += Math.ceil(currentRadius * Math.random() * 2.5)
        ctx.fillStyle = `rgb(124, 0, 166, 0.75)`
      } else {
        ctx.fillStyle = Math.random() < 0.7 ? `rgb(0, 0, 255, 0.1)` : `rgb(0, 0, 255, 0.6)`
      }
      ctx.beginPath()
      const arcStart = drawableShip.gravityBrakeActive ? 0 : TWO_PI * Math.random()
      const arcEnd = drawableShip.gravityBrakeActive ? TWO_PI : TWO_PI * Math.random()
      ctx.arc(drawableShip.canvasCoordFin0P1.x, drawableShip.canvasCoordFin0P1.y, currentRadius, arcStart, arcEnd)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(drawableShip.canvasCoordFin1P1.x, drawableShip.canvasCoordFin1P1.y, currentRadius, arcStart, arcEnd)
      ctx.fill()
    }

    if(drawableShip.miningOreLocation) {
      const om = this._api.frameData.ore_mines.find(o => o.uuid == drawableShip.miningOreLocation)
      if(om) {
        const p0 = drawableShip.canvasCoordCenter;
        const p1 = camera.mapCoordToCanvasCoord(
          {x: om.position_map_units_x, y: om.position_map_units_y},
          camera.getPosition(),
        )
        const rockRadiusCanvasPx = om.service_radius_map_units / 3 / camera.getZoom()
        p1.x += randomInt(rockRadiusCanvasPx * -1, rockRadiusCanvasPx)
        p1.y += randomInt(rockRadiusCanvasPx * -1, rockRadiusCanvasPx)
        ctx.beginPath()
        ctx.strokeStyle = "rgb(255, 0, 0, 0.6)"
        ctx.lineWidth = 4
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
    }

    if(drawableShip.aflame) {
      const flameRadiusCanvasPx = Math.max(1, Math.round(
        Math.sqrt(
          (Math.pow(drawableShip.canvasCoordP1.x - drawableShip.canvasCoordP0.x, 2)
          + Math.pow(drawableShip.canvasCoordP1.y - drawableShip.canvasCoordP0.y, 2))
        ) / 4
      ))
      this.drawAflameEffect(
        ctx,
        camera,
        drawableShip.canvasCoordCenter,
        flameRadiusCanvasPx,
      )
    }

    if(drawBoundingBox && drawableShip.canvasBoundingBox && !drawableShip.exploded) {
      const shipIsLocked = this._api.frameData.ship.scanner_locked && drawableShip.shipId === this._api.frameData.ship.scanner_lock_target
      const shipIsLockedOrLocking = drawableShip.shipId === this._api.frameData.ship.scanner_lock_target && (
        this._api.frameData.ship.scanner_locked || this._api.frameData.ship.scanner_locking
      )
      const cursorOnShip = drawableShip.shipId === scannerTargetIDCursor
      ctx.beginPath()
      ctx.strokeStyle = drawableShip.isSelf ? "rgb(200, 200, 200, 0.85)" : "rgb(255, 0, 0, 0.85)"
      ctx.lineWidth = 2.5
      ctx.rect(
        drawableShip.canvasBoundingBox.x1,
        drawableShip.canvasBoundingBox.y1,
        drawableShip.canvasBoundingBox.x2 - drawableShip.canvasBoundingBox.x1,
        drawableShip.canvasBoundingBox.y2 - drawableShip.canvasBoundingBox.y1,
      )
      ctx.stroke()

      const bbXOffset = drawableShip.canvasBoundingBox.x1
      let bbYOffset = drawableShip.canvasBoundingBox.y2 + 20
      const bbYInterval = 20
      ctx.beginPath()
      ctx.font = 'bold 18px Courier New'
      ctx.fillStyle = drawableShip.isSelf ? "rgb(200, 200, 200, 0.85)" : "rgb(255, 0, 0, 0.85)"
      ctx.textAlign = 'left'
      let desigPrefix = cursorOnShip ? "👉" : ""
      if(!drawableShip.alive) {
        desigPrefix = desigPrefix + "💀"
      }
      ctx.fillText(desigPrefix + drawableShip.designator, bbXOffset, bbYOffset)
      bbYOffset += bbYInterval
      if(drawableShip.distance) {
        ctx.fillText(`${drawableShip.distance} M`, bbXOffset, bbYOffset)
        bbYOffset += bbYInterval
      }
      if (shipIsLockedOrLocking && this._api.frameData.ship.scanner_lock_traversal_slack !== null) {
        const midX  = (drawableShip.canvasBoundingBox.x2 + drawableShip.canvasBoundingBox.x1) / 2
        const midY  = (drawableShip.canvasBoundingBox.y2 + drawableShip.canvasBoundingBox.y1) / 2
        const dx = drawableShip.canvasBoundingBox.x2 - drawableShip.canvasBoundingBox.x1
        const dy = drawableShip.canvasBoundingBox.y2 - drawableShip.canvasBoundingBox.y1
        const maxRadius = Math.max(dx, dy)
        const distance = maxRadius * this._api.frameData.ship.scanner_lock_traversal_slack
        // Vertical CH
        ctx.beginPath()
        ctx.strokeStyle = this._api.frameData.ship.scanner_locked ? "rgb(255, 0, 0, 0.85)" : "rgb(255, 0, 0, 0.5)"
        ctx.moveTo(midX + distance, midY + maxRadius)
        ctx.lineTo(midX + distance, midY - maxRadius)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(midX - distance, midY + maxRadius)
        ctx.lineTo(midX - distance, midY - maxRadius)
        ctx.stroke()
        // Horizontal CH
        ctx.beginPath()
        ctx.moveTo(midX - maxRadius, midY + distance)
        ctx.lineTo(midX + maxRadius, midY + distance)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(midX - maxRadius, midY - distance)
        ctx.lineTo(midX + maxRadius, midY - distance)
        ctx.stroke()
      }
    }
    const tubeFireAnimationFrameCt = 15
    if(
      drawableShip.lastTubeFireFrame !== null
      && (drawableShip.lastTubeFireFrame + tubeFireAnimationFrameCt) >= this._api.frameData.game_frame
    ) {
      const percentComplete = (this._api.frameData.game_frame - drawableShip.lastTubeFireFrame) / tubeFireAnimationFrameCt
      const radiusPx = (this._api.frameData.map_config.units_per_meter / camera.getZoom()) * ((percentComplete * 10) + 4)
      ctx.beginPath()
      ctx.fillStyle = `rgb(200, 200, 200, ${1 - percentComplete})`
      ctx.arc(
        (drawableShip.canvasCoordP1.x + drawableShip.canvasCoordP2.x) / 2,
        (drawableShip.canvasCoordP1.y + drawableShip.canvasCoordP2.y) / 2,
        radiusPx, 0, TWO_PI
      )
      ctx.fill()
    }
  }

  public drawMagnetMine(
    ctx: CanvasRenderingContext2D,
    mine: DrawableMagnetMine,
  ) {
    ctx.drawImage(
      this.magnetMineAsset,
      mine.canvasX1, mine.canvasY1,
      mine.canvasW, mine.canvasH,
    )
    ctx.strokeStyle = "rgb(255, 0, 0, 0.85)"
    ctx.lineWidth = 1.75 + (1.5 * mine.percentArmed)
    if(mine.percentArmed > 0.97) {
      ctx.beginPath()
      ctx.rect(
        mine.canvasBoundingBox.x1,
        mine.canvasBoundingBox.y1,
        mine.canvasBoundingBox.x2 - mine.canvasBoundingBox.x1,
        mine.canvasBoundingBox.y2 - mine.canvasBoundingBox.y1,
      )
      ctx.stroke()
    } else {
      // Draw arming animation with bounding box.
      const topLen = mine.canvasBoundingBox.x2 - mine.canvasBoundingBox.x1
      const sideLen = mine.canvasBoundingBox.y2 - mine.canvasBoundingBox.y1
      // Top Line (left to right)
      if(mine.percentArmed >= 0.25) {
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x1, mine.canvasBoundingBox.y1)
        ctx.lineTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y1)
        ctx.stroke()
      } else {
        let percSide = mine.percentArmed / 0.25
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x1, mine.canvasBoundingBox.y1)
        ctx.lineTo(mine.canvasBoundingBox.x1 + (topLen * percSide), mine.canvasBoundingBox.y1)
        ctx.stroke()
      }
      // right side line (top to bottom)
      if(mine.percentArmed >= 0.50) {
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y1)
        ctx.lineTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y2)
        ctx.stroke()
      } else if (mine.percentArmed >= 0.25 && mine.percentArmed < 0.5) {
        let percSide = (mine.percentArmed - 0.25) / 0.25
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y1)
        ctx.lineTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y1 + (sideLen * percSide))
        ctx.stroke()
      }
      // bottom line (right to left)
      if(mine.percentArmed >= 0.75) {
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x1, mine.canvasBoundingBox.y2)
        ctx.lineTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y2)
        ctx.stroke()
      } else if (mine.percentArmed >= 0.50 && mine.percentArmed < 0.75) {
        let percSide = (mine.percentArmed - 0.5) / 0.25
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x2, mine.canvasBoundingBox.y2)
        ctx.lineTo(mine.canvasBoundingBox.x2 - (topLen * percSide), mine.canvasBoundingBox.y2)
        ctx.stroke()
      }
      // left side (bottom to top)
      if(mine.percentArmed > 0.75 && mine.percentArmed <= 0.97) {
        let percSide = (mine.percentArmed - 0.75) / 0.25
        ctx.beginPath()
        ctx.moveTo(mine.canvasBoundingBox.x1, mine.canvasBoundingBox.y2)
        ctx.lineTo(mine.canvasBoundingBox.x1, mine.canvasBoundingBox.y2 - (sideLen * percSide))
        ctx.stroke()
      }
    }
    const bbXOffset = mine.canvasBoundingBox.x1
    const bbYOffsetInterval = 20
    let bbYOffset = mine.canvasBoundingBox.y2 + bbYOffsetInterval
    ctx.beginPath()
    ctx.font = 'bold 18px Courier New'
    ctx.fillStyle = "rgb(255, 0, 0, 0.85)"
    ctx.textAlign = 'left'
    ctx.fillText("🤖 Mine", bbXOffset, bbYOffset)
    bbYOffset += bbYOffsetInterval
    ctx.fillText(`${mine.distance} M`, bbXOffset, bbYOffset)

  }

  public drawMagnetMineTargetingLines(ctx: CanvasRenderingContext2D, lines: DrawableMagnetMineTargetingLine[]) {
    for(let i in lines) {
      if(Math.random() > 0.65) {
        continue
      }
      let l = lines[i]
      ctx.beginPath()
      ctx.strokeStyle = Math.random() > 0.5 ? `rgb(0, 0, 255, ${getRandomFloat(0.1, 0.6)})` : `rgb(255, 0, 0, ${getRandomFloat(0.1, 0.6)})`
      ctx.lineWidth = 2
      ctx.moveTo(l.mineCanvasCoord.x, l.mineCanvasCoord.y)
      ctx.lineTo(l.targetCanvasCoord.x, l.targetCanvasCoord.y)
      ctx.stroke()
    }
  }

  public drawEMP(ctx: CanvasRenderingContext2D, emp: DrawableEMP) {
    ctx.beginPath()
    ctx.fillStyle = "#0000ff"
    ctx.arc(emp.canvasCoordCenter.x, emp.canvasCoordCenter.y, emp.radiusCanvasPX, 0, TWO_PI)
    ctx.fill()
    if(Math.random() < 0.5){
      ctx.beginPath()
      ctx.arc(emp.canvasCoordCenter.x, emp.canvasCoordCenter.y, emp.radiusCanvasPX * 1.5, 0, TWO_PI)
      ctx.lineWidth = emp.radiusCanvasPX
      ctx.strokeStyle = `rgb(60, 60, 255, ${getRandomFloat(0.4, 0.8)})`
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.lineWidth = 1.75 + (1.5 * emp.percentArmed)
    if(emp.percentArmed > 0.97) {
      ctx.beginPath()
      ctx.strokeStyle = "rgb(255, 0, 0, 0.85)"
      ctx.rect(
        emp.canvasBoundingBox.x1,
        emp.canvasBoundingBox.y1,
        emp.canvasBoundingBox.x2 - emp.canvasBoundingBox.x1,
        emp.canvasBoundingBox.y2 - emp.canvasBoundingBox.y1,
      )
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.strokeStyle = "rgb(255, 0, 0, 0.85)"
      // Draw arming animation with bounding box.
      const topLen = emp.canvasBoundingBox.x2 - emp.canvasBoundingBox.x1
      const sideLen = emp.canvasBoundingBox.y2 - emp.canvasBoundingBox.y1
      // Top Line (left to right)
      if(emp.percentArmed >= 0.25) {
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x1, emp.canvasBoundingBox.y1)
        ctx.lineTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y1)
        ctx.stroke()
      } else {
        let percSide = emp.percentArmed / 0.25
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x1, emp.canvasBoundingBox.y1)
        ctx.lineTo(emp.canvasBoundingBox.x1 + (topLen * percSide), emp.canvasBoundingBox.y1)
        ctx.stroke()
      }
      // right side line (top to bottom)
      if(emp.percentArmed >= 0.50) {
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y1)
        ctx.lineTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y2)
        ctx.stroke()
      } else if (emp.percentArmed >= 0.25 && emp.percentArmed < 0.5) {
        let percSide = (emp.percentArmed - 0.25) / 0.25
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y1)
        ctx.lineTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y1 + (sideLen * percSide))
        ctx.stroke()
      }
      // bottom line (right to left)
      if(emp.percentArmed >= 0.75) {
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x1, emp.canvasBoundingBox.y2)
        ctx.lineTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y2)
        ctx.stroke()
      } else if (emp.percentArmed >= 0.50 && emp.percentArmed < 0.75) {
        let percSide = (emp.percentArmed - 0.5) / 0.25
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x2, emp.canvasBoundingBox.y2)
        ctx.lineTo(emp.canvasBoundingBox.x2 - (topLen * percSide), emp.canvasBoundingBox.y2)
        ctx.stroke()
      }
      // left side (bottom to top)
      if(emp.percentArmed > 0.75 && emp.percentArmed <= 0.97) {
        let percSide = (emp.percentArmed - 0.75) / 0.25
        ctx.beginPath()
        ctx.moveTo(emp.canvasBoundingBox.x1, emp.canvasBoundingBox.y2)
        ctx.lineTo(emp.canvasBoundingBox.x1, emp.canvasBoundingBox.y2 - (sideLen * percSide))
        ctx.stroke()
      }
    }
    const bbYInterval = 20
    const bbXOffset = emp.canvasBoundingBox.x1
    let bbYOffset = emp.canvasBoundingBox.y2 + bbYInterval
    ctx.beginPath()
    ctx.font = 'bold 18px Courier New'
    ctx.fillStyle = "rgb(255, 0, 0, 0.85)"
    ctx.textAlign = 'left'
    ctx.fillText("EMP", bbXOffset, bbYOffset)
    bbYOffset += bbYInterval
    ctx.fillText(`${emp.distance} M`, bbXOffset, bbYOffset)
  }

  private getIconFontSize(camera: Camera) {
    const zoomIx = camera.getZoomIndex()
    if (zoomIx <= 10) {
      return 28
    } else if (zoomIx == 9) {
      return 23
    } else if (zoomIx == 8) {
      return 20
    } else {
      return 18
    }
  }

  public drawSpaceStations(ctx: CanvasRenderingContext2D, camera: Camera,) {
    const cameraPosition = camera.getPosition()
    for(let i in this._api.frameData.space_stations) {
      const st = this._api.frameData.space_stations[i]
      const centerCanvasCoord = camera.mapCoordToCanvasCoord(
        {x: st.position_map_units_x, y: st.position_map_units_y},
        cameraPosition,
      )

      const sideLengthCanvasPx = Math.floor(
        (
          st.collision_radius_meters
          * 2
          * this._api.frameData.map_config.units_per_meter
        )
        / camera.getZoom()
      )
      if(sideLengthCanvasPx < 10) {
        const iconFontSize = this.getIconFontSize(camera)
        ctx.beginPath()
        ctx.font = iconFontSize + "px Courier New";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = 'center';
        ctx.textBaseline = "middle";
        ctx.fillText(
          "🛰️",
          centerCanvasCoord.x,
          centerCanvasCoord.y,
        );
      }
      else {
        this.drawSpaceStation(ctx, camera, st, centerCanvasCoord, sideLengthCanvasPx)
      }
    }
  }
  private drawSpaceStation(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    st: SpaceStation,
    centerCanvasCoord: PointCoord,
    sideLengthCanvasPx: number,
  ) {
    // Draw station body
    const halfLength = Math.floor(sideLengthCanvasPx / 2)
    const lightRadius = Math.max(1, Math.floor(sideLengthCanvasPx / 14))
    ctx.beginPath()
    ctx.fillStyle = "#789096"; // Dark gray blue
    ctx.rect(
      centerCanvasCoord.x - halfLength,
      centerCanvasCoord.y - halfLength,
      sideLengthCanvasPx, sideLengthCanvasPx,
    )
    ctx.fill()

    // Draw service perimeter
    const servicePerimeterCavasPx = st.service_radius_map_units / camera.getZoom()
    const perimeterWidth = Math.ceil(4 * this._api.frameData.map_config.units_per_meter / camera.getZoom())
    if(Math.random() > 0.8) {
      ctx.beginPath()
      ctx.strokeStyle = Math.random() > 0.5 ? "rgb(0, 0, 255, 0.3)" : "rgb(0, 0, 255, 0.7)"
      ctx.lineWidth = perimeterWidth
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y,
        servicePerimeterCavasPx,
        0,
        TWO_PI,
      )
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.strokeStyle = "rgb(0, 0, 255, 0.35)"
    ctx.lineWidth = 1
    ctx.arc(
      centerCanvasCoord.x, centerCanvasCoord.y,
      servicePerimeterCavasPx,
      0,
      TWO_PI,
    )
    ctx.stroke()
    const grav_brake_last_caught: number | undefined = this._api.frameData.ship.scouted_station_gravity_brake_catches_last_frame[st.uuid]
    if(
      grav_brake_last_caught !== undefined
      && (grav_brake_last_caught + 18 > this._api.frameData.game_frame)
    ) {
      // Draw capture effect
      const frame = this._api.frameData.game_frame - grav_brake_last_caught + 1
      if(frame < 12 || Math.random() > 0.8) {
        ctx.beginPath()
        ctx.strokeStyle = `rgb(124, 0, 166, 0.${randomInt(20, 80)})`
        ctx.lineWidth = Math.max(1, Math.ceil(perimeterWidth * frame))
        ctx.arc(
          centerCanvasCoord.x, centerCanvasCoord.y,
          servicePerimeterCavasPx,
          0,
          TWO_PI,
        )
        ctx.stroke()
      }
    }
    // Draw lights
    const lightPushoutMultiple = 3
    ctx.beginPath()
    const lightOn = this._api.frameData.game_frame % 125 < 30
    ctx.fillStyle = lightOn ? "rgb(255, 255, 120, 0.95)" : "#575757"
    ctx.arc(
      centerCanvasCoord.x, centerCanvasCoord.y - halfLength * lightPushoutMultiple,
      lightRadius,
      0,
      TWO_PI,
    )
    ctx.fill()

    ctx.beginPath()
    ctx.arc(
      centerCanvasCoord.x + halfLength * lightPushoutMultiple, centerCanvasCoord.y,
      lightRadius,
      0,
      TWO_PI,
    )
    ctx.fill()

    ctx.beginPath()
    ctx.arc(
      centerCanvasCoord.x, centerCanvasCoord.y + halfLength * lightPushoutMultiple,
      lightRadius,
      0,
      TWO_PI,
    )
    ctx.fill()

    ctx.beginPath()
    ctx.arc(
      centerCanvasCoord.x - halfLength * lightPushoutMultiple, centerCanvasCoord.y,
      lightRadius,
      0,
      TWO_PI,
    )
    ctx.fill()

    // Draw light on effects
    if(lightOn) {
      const effectRadius = lightRadius * 30
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 255, 120, 0.05)"
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y - halfLength * lightPushoutMultiple,
        effectRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
      ctx.beginPath()
      ctx.arc(
        centerCanvasCoord.x + halfLength * lightPushoutMultiple, centerCanvasCoord.y,
        effectRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
      ctx.beginPath()
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y + halfLength * lightPushoutMultiple,
        effectRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
      ctx.beginPath()
      ctx.arc(
        centerCanvasCoord.x - halfLength * lightPushoutMultiple, centerCanvasCoord.y,
        effectRadius,
        0,
        TWO_PI,
      )
      ctx.fill()
    }
  }

  public drawMiningLocations(ctx: CanvasRenderingContext2D, camera: Camera,) {
    const cameraPosition = camera.getPosition()
    const minRockRadius = 10
    for(let ix in this._api.frameData.ore_mines) {
      let om = this._api.frameData.ore_mines[ix]
      let centerCanvasCoord = camera.mapCoordToCanvasCoord(
        {
          x: om.position_map_units_x,
          y: om.position_map_units_y,
        },
        cameraPosition,
      )

      let percentage: number | null = null
      const remainingOre = this._api.frameData.ship.scouted_mine_ore_remaining[om.uuid]
      if(typeof remainingOre !== "undefined") {
        percentage =  remainingOre / om.starting_ore_amount_kg
      }

      const servicePerimeterRadiusCavasPx = om.service_radius_map_units / camera.getZoom()
      const rockRadiusCavasPx =  om.collision_radius_meters * this._api.frameData.map_config.units_per_meter / camera.getZoom()
      if(rockRadiusCavasPx < minRockRadius) {
        const iconFontSize = this.getIconFontSize(camera)
        ctx.beginPath()
        ctx.font = iconFontSize + "px Courier New";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = 'center';
        ctx.textBaseline = "middle";
        ctx.fillText(
          "💎",
          centerCanvasCoord.x,
          centerCanvasCoord.y,
        );
        if(percentage !== null) {
          ctx.beginPath()
          ctx.lineWidth = 3
          ctx.strokeStyle = "#c7a600"
          ctx.arc(centerCanvasCoord.x, centerCanvasCoord.y - 5, iconFontSize * 0.7, 0, TWO_PI * percentage)
          ctx.stroke()
        }
      }
      else {
        this.drawMiningLocation(ctx, camera, om, centerCanvasCoord, rockRadiusCavasPx, servicePerimeterRadiusCavasPx, percentage)
      }
    }
  }
  private drawMiningLocation(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    om: OreMine,
    centerCanvasCoord: PointCoord,
    rockRadiusCavasPx: number,
    servicePerimeterRadiusCavasPx: number,
    minedPercentage: number | null,
  ) {
    // Rock body
    ctx.beginPath()
    ctx.fillStyle = "#4a1e00" // Dark brown
    ctx.arc(
      centerCanvasCoord.x, centerCanvasCoord.y,
      rockRadiusCavasPx,
      0, TWO_PI
    )
    ctx.fill()
    // Mined out percentage indicator
    if(minedPercentage !== null && Math.random() < 0.3) {
      ctx.beginPath()
      ctx.strokeStyle = `rgb(255, 255, 0, 0.${randomInt(20, 50)})`
      ctx.lineWidth = 8
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y,
        rockRadiusCavasPx - (rockRadiusCavasPx / 7),
        0, TWO_PI * minedPercentage
      )
      ctx.stroke()
    }
    // Mining Perimemter
    ctx.beginPath()
    ctx.strokeStyle = "rgb(168, 168, 0, 0.2)" // yellow
    ctx.lineWidth = Math.ceil(
      Math.max(
        1,
        1 * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
      )
    )
    ctx.arc(
      centerCanvasCoord.x, centerCanvasCoord.y,
      servicePerimeterRadiusCavasPx,
      0, TWO_PI
    )
    ctx.stroke()
    // Draw remaining amount
    // Draw lights
    const lightOn = this._api.frameData.game_frame % 125 < 30
    if(lightOn) {
      const bulbRadius = Math.floor(
        Math.max(
          1,
          1 * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
        )
      )
      const effectRadius = Math.floor(
        Math.max(
          1,
          om.service_radius_meters * this._api.frameData.map_config.units_per_meter / camera.getZoom(),
        )
      )
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148)"
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y - servicePerimeterRadiusCavasPx,
        bulbRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148, 0.1)"
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y - servicePerimeterRadiusCavasPx,
        effectRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148)"
      ctx.arc(
        centerCanvasCoord.x + servicePerimeterRadiusCavasPx, centerCanvasCoord.y,
        bulbRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148, 0.1)"
      ctx.arc(
        centerCanvasCoord.x +servicePerimeterRadiusCavasPx , centerCanvasCoord.y,
        effectRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148)"
      ctx.arc(
        centerCanvasCoord.x, centerCanvasCoord.y + servicePerimeterRadiusCavasPx,
        bulbRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148, 0.1)"
      ctx.arc(
        centerCanvasCoord.x , centerCanvasCoord.y + servicePerimeterRadiusCavasPx,
        effectRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148)"
      ctx.arc(
        centerCanvasCoord.x - servicePerimeterRadiusCavasPx, centerCanvasCoord.y,
        bulbRadius, 0, TWO_PI
      )
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "rgb(255, 221, 148, 0.1)"
      ctx.arc(
        centerCanvasCoord.x - servicePerimeterRadiusCavasPx, centerCanvasCoord.y,
        effectRadius, 0, TWO_PI
      )
      ctx.fill()

    }


  }

}
