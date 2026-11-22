import { FullAddress } from "./utils";

export interface CFIAddrTransformer {
    apply(addr: FullAddress) : FullAddress
    revert(addr: FullAddress) : FullAddress
}
