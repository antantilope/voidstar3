
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';


export class ShipAssetRegister {
  type_1_blue?: HTMLImageElement
  type_1_dark_purple?: HTMLImageElement
  type_1_gray?: HTMLImageElement
  type_1_green?: HTMLImageElement
  type_1_light_green?: HTMLImageElement
  type_1_neon_blue?: HTMLImageElement
  type_1_orange?: HTMLImageElement
  type_1_pink?: HTMLImageElement
  type_1_purple?: HTMLImageElement
  type_1_red?: HTMLImageElement
  type_1_yellow?: HTMLImageElement
}



@Injectable({
  providedIn: 'root'
})
export class AssetService {

  public actionTileImgEngineLit: HTMLImageElement = new Image()
  public actionTileImgEngineOnline: HTMLImageElement = new Image()
  public actionTileImgScannerOnline: HTMLImageElement = new Image()

  public magnetMineAsset: HTMLImageElement = new Image()

  public shipAssetRegister: ShipAssetRegister = {}

  constructor(
    private _api: ApiService,
  ) {
    console.log("AssetService::constructor")
    this.actionTileImgEngineLit.src = "/static/img/light-engine.jpg"
    this.actionTileImgEngineOnline.src = "/static/img/activate-engine.jpg"
    this.actionTileImgScannerOnline.src = "/static/img/activate-scanner.jpg"
    this.magnetMineAsset.src = "/static/img/magnet-mine.svg"
  }
}
