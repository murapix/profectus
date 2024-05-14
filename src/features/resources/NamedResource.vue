<template>
    <component :is="amountTag ?? 'span'" >{{ amount }}</component> <component :is="nameTag ?? 'span'" >{{ name }}</component>
</template>

<script setup lang="tsx">
import Decimal, { DecimalSource } from 'util/bignum';
import { Resource, displayResource } from './resource';
import { computed, unref } from 'vue';

const props = defineProps<{
    resource: Resource,
    override?: DecimalSource,
    amountTag?: string,
    nameTag?: string
}>();

const amount = computed(() => displayResource(props.resource, props.override));
const name = computed(() => {
    const resourceAmount = unref(props.override ?? props.resource);
    if (Decimal.gt(resourceAmount, 1.5) || Decimal.lt(resourceAmount, 0.5)) return unref(props.resource.displayName);
    return Decimal.eq(unref(amount), 1) ? unref(props.resource.singularName) : unref(props.resource.displayName);
});
</script>